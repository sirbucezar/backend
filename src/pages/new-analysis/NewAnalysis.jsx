import React, { useState } from 'react';
import s from './styles.module.scss';
import UploadVideo from './upload-video/UploadVideo';
import ChooseStudent from './choose-student/ChooseStudent';
import Rubrics from './rubrics/Rubrics';
import VideoEditor from './video-editor/VideoEditor';
import { toast } from 'sonner';

const NewAnalysis = () => {
  const [showVideoEditor, setShowVideoEditor] = useState(false);

  // Student, Sport, and local video states
  const [selectedStudent, setSelectedStudent] = useState('');
  const [currentRubric, setCurrentRubric] = useState(null); // e.g. { name: "shotput" } or something
  const [videoSrc, setVideoSrc] = useState('');
  const [fileName, setFileName] = useState(null);
  const [rawFile, setRawFile] = useState(null);

  // SAS + “Analyze” workflow
  const [sasUrl, setSasUrl] = useState(null);
  const [isStagesSaved, setIsStagesSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Local “rubric” with 5 stages that store frames, not timestamps
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

  // 1) Store video for local preview, but do NOT upload yet
  const handleVideoUpload = (file) => {
    const fileURL = URL.createObjectURL(file);
    setVideoSrc(fileURL);
    setFileName(file.name);
    setRawFile(file);
  };

  // 2) “Submit” → only does SAS + upload → not calling process_video yet
  const handleSubmit = async () => {
    // Ensure user picked everything
    if (!selectedStudent) {
      toast.error('Please choose a student first.');
      return;
    }
    if (!currentRubric) {
      toast.error('Please pick a sport/rubric first.');
      return;
    }
    if (!rawFile || !fileName) {
      toast.error('Please upload a video first.');
      return;
    }

    // Actually do the upload
    try {
      setIsLoading(true);
      toast.info('Getting SAS token...');

      const sas = await getSasForFile(fileName);
      toast.success('SAS received. Uploading video...');

      await uploadFileToBlob(rawFile, sas);
      toast.success('Upload complete!');

      // Save the SAS so we can do the final “process_video” later
      setSasUrl(sas);

      // Show the editor now that the video is in Azure
      setShowVideoEditor(true);

    } catch (err) {
      toast.error(`Error uploading video: ${err.message}`);
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3) “Analyze” → only after user sets all stage frames, we do process_video
  const handleAnalyze = async () => {
    // must have all 5 stages saved
    if (!isStagesSaved) {
      toast.error('Please save all 5 stages before analyzing.');
      return;
    }
    if (!sasUrl) {
      toast.error('No SAS URL found. Did you upload the video first?');
      return;
    }

    try {
      setIsLoading(true);
      toast.info('Sending process_video request...');

      await processVideo(sasUrl);
      toast.success('Video processed successfully!');

    } catch (err) {
      toast.error(`Error analyzing video: ${err.message}`);
      console.error('Analyze error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4) GET SAS
  const getSasForFile = async (filename) => {
    const functionUrl = `https://dotnet-fapp.azurewebsites.net/api/GetSasToken`;
    const functionKey = `3-172eA71LvFWcg-aWsKHJlQu_VyQ0aFe9lxR0BrQsAJAzFux1i_pA%3D%3D`;
    const reqUrl = `${functionUrl}?code=${functionKey}&filename=${encodeURIComponent(filename)}`;

    const resp = await fetch(reqUrl);
    if (!resp.ok) {
      throw new Error(`SAS error: HTTP ${resp.status}`);
    }
    const data = await resp.json();
    return data.sas_url;
  };

  // 5) PUT file to Blob
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
      throw new Error(`Blob upload failed: HTTP ${resp.status}`);
    }
  };

  // 6) POST process_video with frames
  const processVideo = async (uploadedSasUrl) => {
    // Convert your stage_name => name, keep frames in start_time/end_time
    const mappedStages = rubric.stages.map((st) => ({
      name: st.stage_name,
      start_time: st.start_time ?? 0,
      end_time: st.end_time ?? 0,
    }));

    // If your chosen sport is stored in e.g. currentRubric.name, fallback to “shotput”
    const exercise = currentRubric?.name || 'shotput';

    // Format the user name: “Doe_John”
    const userName = formatStudentName(selectedStudent);

    const payload = {
      exercise,
      video_url: uploadedSasUrl,
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

  // Format: “John Doe” => “Doe_John”
  const formatStudentName = (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'Default_User';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) return parts[0];
    return `${parts[1]}_${parts[0]}`;
  };

  return (
    <div className={s.newAnalysis}>
      <div className={s.newAnalysis__main}>
        <div className={s.newAnalysis__left}>
          <div className={s.newAnalysis__title}>Create a new analysis</div>

          {/* If we haven't shown the editor yet, show the form */}
          {!showVideoEditor ? (
            <>
              {/* 1) Let user pick a student => store in selectedStudent */}
              <ChooseStudent setSelectedStudent={setSelectedStudent} />

              {/* 2) Let user pick a video => store rawFile + preview */}
              <UploadVideo
                onUpload={handleVideoUpload}
                fileName={fileName}
                setFileName={setFileName}
              />

              {/* 3) Let them pick a sport in <Rubrics>, stored in currentRubric */}
              {/* We'll show rubrics on the right side, or here if you prefer */}
              {/* We'll do it in the "else" below, but if you want it here, move the code around */}

              {/* 4) "Submit" does upload -> show Editor */}
              <button
                className={s.newAnalysis__submit}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Uploading...' : 'Submit'}
              </button>
            </>
          ) : (
            // If we are showing the editor, user can “Analyze” once stages are saved
            <button
              className={s.newAnalysis__submit}
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Analyze'}
            </button>
          )}
        </div>

        {/* If the editor is shown => local playback + stage frames. Else => show Rubrics. */}
        {showVideoEditor ? (
          <VideoEditor
            videoSrc={videoSrc}
            setIsStagesSaved={setIsStagesSaved}
            rubric={rubric}
            setRubric={setRubric}
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