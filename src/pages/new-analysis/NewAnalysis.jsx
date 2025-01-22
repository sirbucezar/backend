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
  // Provide a fallback with 5 empty stages so that if you never pick a rubric,
  // you won't get a fatal crash. Adjust as needed if your 'Rubrics' sets them:
  const [currentRubric, setCurrentRubric] = useState({
    stages: [
      { start_time: null, end_time: null },
      { start_time: null, end_time: null },
      { start_time: null, end_time: null },
      { start_time: null, end_time: null },
      { start_time: null, end_time: null },
    ],
  });

  // Other states
  const [sasUrl, setSasUrl] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isStagesSaved, setIsStagesSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle local video selection
  const handleVideoUpload = (file) => {
    setVideoFile(file);
    setVideoSrc(URL.createObjectURL(file));
    setFileName(file.name);
  };

  // Optionally rename the student in some format
  const formatStudentName = (name) => {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 ? `${parts[1]}_${parts[0]}` : parts[0];
  };

  // GET the SAS URL from your function
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

  // PUT the file up to Azure Blob Storage
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

  // On "Submit" button
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent || !fileName || !videoFile) {
      toast.error('Please select a student, video, and ensure a file is chosen.');
      return;
    }
    // If your code *requires* a valid rubric, you can check currentRubric as well:
    if (!currentRubric || !currentRubric.stages) {
      toast.error('Please select a sport/rubric before submitting.');
      return;
    }

    setIsLoading(true);
    toast.info('Getting SAS token...');

    try {
      const sasUrl = await getSasForFile(fileName);
      if (sasUrl) {
        toast.success('SAS token received! Uploading...');
        await uploadFileToBlob(videoFile, sasUrl);

        // We do *not* replace videoSrc with the blob URL, we keep local for the editor
        setShowVideoEditor(true);
      }
    } catch (error) {
      toast.error('Error during submission. Check logs.');
    } finally {
      setIsLoading(false);
    }
  };

  // On "Analyze" button
  const handleAnalyze = async () => {
    if (!isStagesSaved || !fileName || !sasUrl) {
      toast.warning('Ensure all steps are completed before analyzing (incl. saving stages).');
      return;
    }

    setIsLoading(true);
    toast.info('Submitting analysis...');

    try {
      const functionUrl = 'https://dotnet-fapp.azurewebsites.net/api/process_video';
      const functionKey = '3-172eA71LvFWcg-aWsKHJlQu_VyQ0aFe9lxR0BrQsAJAzFux1i_pA%3D%3D';
      const requestUrl = `${functionUrl}?code=${functionKey}`;

      const postData = {
        exercise: 'shotput', // or whichever sport the user picked
        video_url: sasUrl,   // the Blob SAS path we stored
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

          {/* If we haven't opened the VideoEditor yet, we show the form */}
          {!showVideoEditor ? (
            <form onSubmit={handleSubmit}>
              <ChooseStudent
                setSelectedStudent={(student) => {
                  setSelectedStudent(student);
                  toast.success(`Student ${formatStudentName(student)} selected`);
                }}
              />
              {/* Possibly you have a "sport" selector or "Rubrics" here as well; 
                  as soon as the user picks a "sport," you call setCurrentRubric(...).
              */}
              <UploadVideo
                onUpload={handleVideoUpload}
                fileName={fileName}
                setFileName={setFileName}
              />
              <Rubrics
                currentRubric={currentRubric}
                setCurrentRubric={setCurrentRubric}
              />

              <button
                type="submit"
                className={s.newAnalysis__submit}
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Submit'}
              </button>
            </form>
          ) : (
            // Once we've uploaded, we show "Analyze" button:
            <button
              className={s.newAnalysis__submit}
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Analyze'}
            </button>
          )}
        </div>

        {/* If showVideoEditor is true, then show our stage selection + local video. */}
        {showVideoEditor && (
          <VideoEditor
            videoSrc={videoSrc}
            setIsStagesSaved={setIsStagesSaved}
            rubric={currentRubric}
            setRubric={setCurrentRubric}
            currentStageIndex={currentStageIndex}
            setCurrentStageIndex={setCurrentStageIndex}
          />
        )}
      </div>
    </div>
  );
};

export default NewAnalysis;