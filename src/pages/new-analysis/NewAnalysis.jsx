import React, { useState } from 'react';
import s from './styles.module.scss';
import UploadVideo from './upload-video/UploadVideo';
import ChooseStudent from './choose-student/ChooseStudent';
import Rubrics from './rubrics/Rubrics';
import VideoEditor from './video-editor/VideoEditor';
import { toast } from 'sonner';

const NewAnalysis = () => {
  const [showVideoEditor, setShowVideoEditor] = useState(false);

  // For Student & Sport
  // Instead of a boolean, store the actual student name:
  const [selectedStudent, setSelectedStudent] = useState('');
  const [currentRubric, setCurrentRubric] = useState(null);

  // Local Video
  const [videoSrc, setVideoSrc] = useState('');
  const [fileName, setFileName] = useState(null);

  // Extra states
  const [isStagesSaved, setIsStagesSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // This is your “rubric” data with 5 stages
  const [rubric, setRubric] = useState({
    video_id: '',
    stages: [
      { stage_name: 'stage1', start_time: null, end_time: null },
      { stage_name: 'stage2', start_time: null, end_time: null },
      { stage_name: 'stage3', start_time: null, end_time: null },
      { stage_name: 'stage4', start_time: null, end_time: null },
      { stage_name: 'stage5', start_time: null, end_time: null },
    ],
  });

  // 1) STOP user if something not chosen & then do the SAS -> PUT -> POST
  const handleSubmit = async () => {
    // Check required fields
    if (!currentRubric) {
      toast.error('Please select a sport before submitting.');
      return;
    }
    if (!fileName) {
      toast.error('Please select a video before submitting.');
      return;
    }
    if (!selectedStudent) {
      toast.error('Please select a student before submitting.');
      return;
    }

    try {
      setIsLoading(true);
      toast.info('Fetching SAS token...');

      // 1) GET SAS
      const sas = await getSasForFile(fileName);
      toast.success('SAS token received! Uploading to blob...');

      // 2) PUT to blob
      // We need the actual File object to do that, so ensure you store it as well:
      // but from your code, you're only storing the fileName, not the raw file.
      // We'll assume you are storing the raw file somewhere, or you'll adjust the code below.
      // (If you need to store the "rawFile" in state, do so in handleVideoUpload)
      if (!rawFile) {
        toast.error('The raw video File is missing in state. Please store it in handleVideoUpload.');
        return;
      }
      await uploadFileToBlob(rawFile, sas);
      toast.success('Video uploaded successfully!');

      // 3) POST to process_video
      toast.info('Sending process_video request...');
      await processVideo(sas);
      toast.success('process_video completed successfully!');

      // 4) Now show the video editor
      setShowVideoEditor(true);
    } catch (err) {
      toast.error(`Upload or process error: ${err.message}`);
      console.error('Video upload/process failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // "GetSasToken" function
  const getSasForFile = async (filename) => {
    const functionUrl = `https://dotnet-fapp.azurewebsites.net/api/GetSasToken`;
    const functionKey = `3-172eA71LvFWcg-aWsKHJlQu_VyQ0aFe9lxR0BrQsAJAzFux1i_pA%3D%3D`;
    const reqUrl = `${functionUrl}?code=${functionKey}&filename=${encodeURIComponent(filename)}`;

    const resp = await fetch(reqUrl, { method: 'GET' });
    if (!resp.ok) {
      throw new Error(`SAS error: HTTP ${resp.status}`);
    }
    const data = await resp.json();
    return data.sas_url;
  };

  // Actually do the PUT
  const uploadFileToBlob = async (file, sasUrl) => {
    const resp = await fetch(sasUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type,
      },
      body: file,
    });
    if (!resp.ok) {
      throw new Error(`Upload failed: HTTP ${resp.status}`);
    }
  };

  // "process_video" function => POST with your exact JSON format
  const processVideo = async (uploadedSasUrl) => {
    // We also rename “stage_name” => “name” for each stage:
    const mappedStages = rubric.stages.map((st) => ({
      name: st.stage_name,
      start_time: st.start_time ?? 0,
      end_time: st.end_time ?? 0,
    }));

    // If your chosen sport is stored in currentRubric?.name, otherwise default "shotput"
    const exercise = currentRubric?.name || 'shotput';

    // We get the actual name from selectedStudent
    const userName = formatStudentName(selectedStudent);

    const payload = {
      exercise,
      video_url: uploadedSasUrl,   // the blob SAS
      stages: mappedStages,
      user_id: userName,
      deployment_id: 'preprod',
      processing_id: '',
      timestamp: new Date().toISOString(),
    };

    const functionUrl = 'https://dotnet-fapp.azurewebsites.net/api/process_video';
    const functionKey = '3-172eA71LvFWcg-aWsKHJlQu_VyQ0aFe9lxR0BrQsAJAzFux1i_pA%3D%3D';
    const requestUrl = `${functionUrl}?code=${functionKey}`;

    const resp = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      throw new Error(`process_video failed: HTTP ${resp.status}`);
    }
    return await resp.json();
  };

  // Just a quick helper to transform "Jane Doe" => "Doe_Jane"
  const formatStudentName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') {
      return 'Default_User';
    }
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) {
      return parts[0]; // if single name
    }
    return parts[1] + '_' + parts[0];
  };

  // ***IMPORTANT***: We also need to store the raw file in state so we can do the upload on submit
  const [rawFile, setRawFile] = useState(null);

  // Let user pick file. We just set the local preview; we do NOT do SAS yet.
  const handleVideoUpload = (file) => {
    const fileURL = URL.createObjectURL(file);
    setVideoSrc(fileURL);
    setFileName(file.name);
    // store the raw file so we can upload it later
    setRawFile(file);
  };

  return (
    <div className={s.newAnalysis}>
      <div className={s.newAnalysis__main}>
        <div className={s.newAnalysis__left}>
          <div className={s.newAnalysis__title}>Create a new analysis</div>

          {/* If we haven't shown the editor yet, show the form for Student + Video + Submit */}
          {!showVideoEditor ? (
            <>
              {/* The student picker now sets the actual name, e.g. "John Doe" */}
              <ChooseStudent setSelectedStudent={setSelectedStudent} />

              {/* We only do local preview for now */}
              <UploadVideo
                onUpload={handleVideoUpload}
                fileName={fileName}
                setFileName={setFileName}
              />

              {/* We do the SAS + PUT + process_video on submit */}
              <button
                className={s.newAnalysis__submit}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                Submit
              </button>
            </>
          ) : (
            <button
              className={`${s.newAnalysis__submit} ${isLoading ? s.disabled : ''}`}
              onClick={() => toast('You are already in the editor!')}
            >
              {isLoading ? 'Loading...' : 'Analyze'}
            </button>
          )}
        </div>

        {showVideoEditor ? (
          <VideoEditor
            videoSrc={videoSrc}
            setIsStagesSaved={setIsStagesSaved}
            rubric={rubric}
            setRubric={setRubric}
          />
        ) : (
          <Rubrics currentRubric={currentRubric} setCurrentRubric={setCurrentRubric} />
        )}
      </div>
    </div>
  );
};

export default NewAnalysis;