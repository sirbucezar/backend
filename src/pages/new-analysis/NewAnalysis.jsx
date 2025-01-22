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

   const getSasForFile = async (filename) => {
      const functionUrl = `https://dotnet-fapp.azurewebsites.net/api/GetSasToken?code=3-172eA71LvFWcg-aWsKHJlQu_VyQ0aFe9lxR0BrQsAJAzFux1i_pA%3D%3D&filename=${encodeURIComponent(filename)}`;

      try {
         const response = await fetch(functionUrl, { method: 'GET' });

         if (!response.ok) {
            throw new Error(`SAS error: HTTP ${response.status}`);
         }

         const data = await response.json();
         return data.sas_url;
      } catch (error) {
         console.error('Error fetching SAS URL:', error);
         toast.error('Failed to get SAS URL');
         throw error;
      }
   };

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

   const handleSubmit = async (e) => {
      e.preventDefault();
      if (currentRubric && fileName && isUserChosen) {
         setIsLoading(true);
         toast.info('Getting SAS token...');

         try {
            const sasUrl = await getSasForFile(fileName);

            if (sasUrl) {
               toast.success('SAS token received! Uploading...');
               await uploadFileToBlob(videoSrc, sasUrl);
               setShowVideoEditor(true);
            }
         } catch (error) {
            toast.error('Error during submission. Check logs.');
         } finally {
            setIsLoading(false);
         }
      } else {
         toast.error('Please select a student, rubric, and video before submitting.');
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
                     <button type="submit" className={s.newAnalysis__submit} disabled={isLoading}>
                        {isLoading ? 'Uploading...' : 'Submit'}
                     </button>
                  </form>
               ) : (
                  <button className={`${s.newAnalysis__submit} ${isLoading ? s.disabled : ''}`}>
                     Analyzing...
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