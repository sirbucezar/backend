import React, { useState } from 'react';
import s from './styles.module.scss';
import UploadVideo from './upload-video/UploadVideo';
import ChooseStudent from './choose-student/ChooseStudent';
import Rubrics from './rubrics/Rubrics';
import VideoEditor from './video-editor/VideoEditor';
import { toast } from 'sonner';

const NewAnalysis = () => {
  const [showVideoEditor, setShowVideoEditor] = useState(false);

  // Local video states
  const [videoFile, setVideoFile] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [fileName, setFileName] = useState(null);

  // Student & rubrics
  const [selectedStudent, setSelectedStudent] = useState('');

  // We’ll store the chosen “sport” or the entire “rubric” in here.
  // If your <Rubrics> component sets a single field like “sport,” adapt accordingly.
  const [currentRubric, setCurrentRubric] = useState(null);

  // Other states
  const [sasUrl, setSasUrl] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isStagesSaved, setIsStagesSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1) Handle local video selection
  const handleVideoUpload = (file) => {
    setVideoFile(file);
    setVideoSrc(URL.createObjectURL(file));
    setFileName(file.name);
  };

  // 2) Format the student name if needed
  const formatStudentName = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? `${parts[1]}_${parts[0]}` : parts[0];
  };

  // 3) Get SAS token from your function
  const getSasForFile = async (filename) => {
    const functionUrl = `https://dotnet-fapp.azurewebsites.net/api/GetSasToken`;
    const functionKey = `3-172eA71LvFWcg-aWsKHJlQu_VyQ0aFe9lxR0BrQsAJAzFux1i_pA%3D%3D`;

    try {
      const response = await fetch(
        `${functionUrl}?code=${functionKey}&filename=${encodeURIComponent(filename)}`,
        { method: 'GET' }
      );
      if (!response.ok) {
        throw new Error(`SAS error: HTTP ${response.status}`);
      }
      const data = await response.json();
      setSasUrl(data.sas_url);
      return data.sas_url;
    } catch (error) {
      console.error('Error fetching SAS URL:', error);
      toast.error('Failed to get SAS URL');
      throw error;
    }
  };

  // 4) Upload file to Azure
  const uploadFileToBlob = async (file, sasUrl) => {
    try {
      const response = await fetch(sasUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type,
        },
        body: file,
      });
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      toast.success('Video uploaded successfully!');
      return sasUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Upload failed');
      throw error;
    }
  };

  // 5) On “Submit”
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent) {
      toast.error('Please select a student first.');
      return;
    }
    if (!videoFile || !fileName) {
      toast.error('Please select a video to upload.');
      return;
    }
    if (!currentRubric) {
      toast.error('Please select a sport / rubric before submitting.');
      return;
    }

    setIsLoading(true);
    toast.info('Getting SAS token...');

    try {
      const sasUrl = await getSasForFile(fileName);
      if (sasUrl) {
        toast.success('SAS token received! Uploading...');
        await uploadFileToBlob(videoFile, sasUrl);

        // We keep local video for the editor
        setShowVideoEditor(true);
      }
    } catch (error) {
      toast.error('Error during submission. Check logs.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6) On “Analyze”
  const handleAnalyze = async () => {
    if (!isStagesSaved || !fileName || !sasUrl) {
      toast.warning('Ensure all steps are completed & stages saved before analyzing.');
      return;
    }
    setIsLoading(true);
    toast.info('Submitting analysis...');

    try {
      const functionUrl = 'https://dotnet-fapp.azurewebsites.net/api/process_video';
      const functionKey = '3-172eA71LvFWcg-aWsKHJlQu_VyQ0aFe9lxR0BrQsAJAzFux1i_pA%3D%3D';
      const requestUrl = `${functionUrl}?code=${functionKey}`;

      const postData = {
        // If your rubric includes the “sport,” or if you store it separately, adapt as needed:
        exercise: currentRubric?.sport || 'shotput',
        video_url: sasUrl,
        stages: currentRubric.stages,
        user_id: formatStudentName(selectedStudent),
        deployment_id: 'preprod',
        processing_id: '',
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      toast.success('Analysis completed successfully!');
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={s.newAnalysis}>
      <div className={s.newAnalysis__main}>
        <div className={s.newAnalysis__left}>
          <div className={s.newAnalysis__title}>Create a new analysis</div>

          {/* If we haven't shown the editor yet, show the form for Student + Video + Submit */}
          {!showVideoEditor ? (
            <form onSubmit={handleSubmit}>
              {/* 1) Choose Student */}
              <ChooseStudent
                setSelectedStudent={(student) => {
                  setSelectedStudent(student);
                  toast.success(`Student ${formatStudentName(student)} selected`);
                }}
              />

              {/* 2) Upload Video */}
              <UploadVideo
                onUpload={handleVideoUpload}
                fileName={fileName}
                setFileName={setFileName}
              />

              {/* The "Submit" button triggers handleSubmit */}
              <button
                type="submit"
                className={s.newAnalysis__submit}
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Submit'}
              </button>
            </form>
          ) : (
            // Once we show the editor, we only show an "Analyze" button
            <button
              className={s.newAnalysis__submit}
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Analyze'}
            </button>
          )}
        </div>

        {/* If the editor is shown, we do the local playback + stage selection.
            Otherwise, we show the Rubrics (where you pick the "sport" or the stage definitions).
        */}
        {showVideoEditor ? (
          <VideoEditor
            videoSrc={videoSrc}
            setIsStagesSaved={setIsStagesSaved}
            rubric={currentRubric}
            setRubric={setCurrentRubric}
            currentStageIndex={currentStageIndex}
            setCurrentStageIndex={setCurrentStageIndex}
          />
        ) : (
          <Rubrics
            currentRubric={currentRubric}
            setCurrentRubric={setCurrentRubric}
          />
        )}
      </div>
    </div>
  );
};

export default NewAnalysis;