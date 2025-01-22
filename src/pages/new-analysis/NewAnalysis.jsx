import React, { useState } from 'react';
import s from './styles.module.scss';
import UploadVideo from './upload-video/UploadVideo';
import ChooseStudent from './choose-student/ChooseStudent';
import Rubrics from './rubrics/Rubrics';
import VideoEditor from './video-editor/VideoEditor';
import { toast } from 'sonner';

const NewAnalysis = () => {
   const [showVideoEditor, setShowVideoEditor] = useState(false);
   const [videoSrc, setVideoSrc] = useState(null);
   const [currentRubric, setCurrentRubric] = useState(null);
   const [fileName, setFileName] = useState(null);
   const [isUserChosen, setIsUserChosen] = useState(false);
   const [isStagesSaved, setIsStagesSaved] = useState(false);
   const [isLoading, setIsLoading] = useState(false);

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

   const handleVideoUpload = (file) => {
      setVideoSrc(file);
      setFileName(file.name);
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (currentRubric && fileName && isUserChosen) {
         setShowVideoEditor(true);
      }
   };

   const handleAnalyze = async () => {
      if (isStagesSaved && fileName && videoSrc) {
         setIsLoading(true);
         try {
            const functionUrl = 'https://dotnet-fapp.azurewebsites.net/api/GetSasToken';
            const functionKey = '3-172eA71LvFWcg-aWsKHJlQu_VyQ0aFe9lxR0BrQsAJAzFux1i_pA%3D%3D';
            const requestUrl = `${functionUrl}?code=${functionKey}&filename=${encodeURIComponent(fileName)}`;

            const response = await fetch(requestUrl, { method: 'GET' });

            if (!response.ok) {
               throw new Error(`Error fetching SAS token: ${response.status}`);
            }

            const data = await response.json();
            const sasUrl = data.sas_url;

            console.log('SAS URL retrieved:', sasUrl);

            await uploadFile(videoSrc, sasUrl);
            toast.success('Video uploaded successfully!');
         } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload video.');
         } finally {
            setIsLoading(false);
         }
      }
   };

   const uploadFile = async (file, sasUrl) => {
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

         console.log('File uploaded successfully to:', sasUrl);
      } catch (error) {
         console.error('Error uploading file:', error);
      }
   };

   return (
      <div className={s.newAnalysis}>
         <div className={s.newAnalysis__main}>
            <div className={s.newAnalysis__left}>
               <div className={s.newAnalysis__title}>Create a new analysis</div>
               {!showVideoEditor ? (
                  <form onSubmit={handleSubmit}>
                     <ChooseStudent setIsUserChosen={setIsUserChosen} />
                     <UploadVideo
                        onUpload={handleVideoUpload}
                        fileName={fileName}
                        setFileName={setFileName}
                     />
                     <button type="submit" className={s.newAnalysis__submit}>
                        Submit
                     </button>
                  </form>
               ) : (
                  <button
                     className={`${s.newAnalysis__submit} ${isLoading ? s.disabled : ''}`}
                     onClick={handleAnalyze}
                     disabled={isLoading}
                  >
                     {!isLoading ? 'Analyze' : 'Uploading...'}
                  </button>
               )}
            </div>
            {showVideoEditor ? (
               <VideoEditor
                  videoSrc={URL.createObjectURL(videoSrc)}
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