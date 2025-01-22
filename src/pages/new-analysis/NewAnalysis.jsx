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
   const [selectedStudent, setSelectedStudent] = useState(null);
   const [isStagesSaved, setIsStagesSaved] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [sasUrl, setSasUrl] = useState(null);
   const [currentStageIndex, setCurrentStageIndex] = useState(0);

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

   const formatStudentName = (name) => {
      if (!name) return '';
      const parts = name.trim().split(/\s+/);
      return parts.length >= 2 ? `${parts[1]}_${parts[0]}` : parts[0];
   };

   const getSasForFile = async (filename) => {
      const functionUrl = `https://dotnet-fapp.azurewebsites.net/api/GetSasToken?code=3-172eA71LvFWcg-aWsKHJlQu_VyQ0aFe9lxR0BrQsAJAzFux1i_pA%3D%3D&filename=${encodeURIComponent(filename)}`;
      try {
         const response = await fetch(functionUrl, { method: 'GET' });
         if (!response.ok) throw new Error(`SAS error: HTTP ${response.status}`);
         const data = await response.json();
         setSasUrl(data.sas_url);
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

         if (!response.ok) throw new Error(`Upload failed with status: ${response.status}`);
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
      if (!selectedStudent || !fileName) {
         toast.error('Please select a student and video before submitting.');
         return;
      }
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
   };

   const handleAnalyze = async () => {
      if (!isStagesSaved || !fileName || !sasUrl) {
         toast.warning('Ensure all steps are completed before analyzing.');
         return;
      }

      setIsLoading(true);
      toast.info('Submitting analysis...');

      try {
         const functionUrl = 'https://dotnet-fapp.azurewebsites.net/api/process_video';
         const functionKey = '3-172eA71LvFWcg-aWsKHJlQu_VyQ0aFe9lxR0BrQsAJAzFux1i_pA%3D%3D';
         const requestUrl = `${functionUrl}?code=${functionKey}`;

         const postData = {
            exercise: 'shotput',
            video_url: sasUrl,
            stages: rubric.stages,
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

         if (!response.ok) throw new Error(`Request failed with status ${response.status}`);

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
               {!showVideoEditor ? (
                  <form onSubmit={handleSubmit}>
                     <ChooseStudent setSelectedStudent={(student) => {
                        setSelectedStudent(student);
                        toast.success(`Student ${formatStudentName(student)} selected`);
                     }} />
                     <UploadVideo onUpload={handleVideoUpload} fileName={fileName} setFileName={setFileName} />
                     <button type="submit" className={s.newAnalysis__submit} disabled={isLoading}>
                        {isLoading ? 'Uploading...' : 'Submit'}
                     </button>
                  </form>
               ) : (
                  <button className={s.newAnalysis__submit} onClick={handleAnalyze} disabled={isLoading}>
                     {isLoading ? 'Processing...' : 'Analyze'}
                  </button>
               )}
            </div>
            {showVideoEditor ? (
               <VideoEditor
                  videoSrc={videoSrc}
                  setIsStagesSaved={setIsStagesSaved}
                  rubric={rubric}
                  setRubric={setRubric}
                  currentStageIndex={currentStageIndex}
                  setCurrentStageIndex={setCurrentStageIndex}
               />
            ) : (
               <Rubrics currentRubric={currentRubric} setCurrentRubric={setCurrentRubric} />
            )}
         </div>
      </div>
   );
};

export default NewAnalysis;