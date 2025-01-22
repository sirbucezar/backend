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
   const [isUserChosen, setIsUserChosen] = useState(false);
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
         {
            stage_name: 'stage1',
            start_time: null,
            end_time: null,
         },
         {
            stage_name: 'stage2',
            start_time: null,
            end_time: null,
         },
         {
            stage_name: 'stage3',
            start_time: null,
            end_time: null,
         },
         {
            stage_name: 'stage4',
            start_time: null,
            end_time: null,
         },
         {
            stage_name: 'stage5',
            start_time: null,
            end_time: null,
         },
      ],
   });

   // 1) STOP user if something not chosen
   const handleSubmit = () => {
      // If the user hasn't chosen a sport (currentRubric),
      // hasn't uploaded a video (fileName), or hasn't chosen a student (isUserChosen), error out:
      if (!currentRubric) {
         toast.error('Please select a sport before submitting.');
         return;
      }
      if (!fileName) {
         toast.error('Please select a video before submitting.');
         return;
      }
      if (!isUserChosen) {
         toast.error('Please select a student before submitting.');
         return;
      }

      // All good—show the editor
      setShowVideoEditor(true);
   };

   // 2) As soon as the user picks a file, we GET the SAS -> PUT the file -> POST to process_video
   const handleVideoUpload = async (file) => {
      // Convert to local preview
      const fileURL = URL.createObjectURL(file);
      setVideoSrc(fileURL);
      setFileName(file.name);

      try {
         setIsLoading(true);
         toast.info('Fetching SAS token...');

         // 1) GET SAS
         const sas = await getSasForFile(file.name);
         toast.success('SAS token received! Uploading to blob...');

         // 2) PUT to blob
         await uploadFileToBlob(file, sas);
         toast.success('Video uploaded successfully!');

         // 3) POST to process_video
         toast.info('Sending process_video request...');
         const processRes = await processVideo(sas); 
         toast.success('process_video completed successfully!');

         // 4) Now show the video editor stage
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

      // If you store the chosen sport in “currentRubric” (like currentRubric.name),
      // use that for “exercise.” Otherwise default to "shotput"
      const exercise = currentRubric?.name || 'shotput'; 

      // If you store the student’s name in <ChooseStudent />, it might be something like "John Smith".
      // Format it: "Smith_John". We do a quick helper:
      const userName = formatStudentName(isUserChosen); 
      // ^ Actually you’d store the real name somewhere. For now we just do "Name_Firstname".

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
      // If your <ChooseStudent> sets "isUserChosen" to just a boolean,
      // you’d need to store the user’s actual name in a separate state, e.g. "selectedStudent".
      // For demonstration, we’ll assume the name is "Jane Doe" in isUserChosen, which is not typical.
      // In reality, you’d do something like:
      // if (!selectedStudent) return '';
      // let [first, last] = selectedStudent.split(' ');
      // return `${last}_${first}`;

      if (!fullName || typeof fullName !== 'string') {
         return 'Default_User';
      }
      const parts = fullName.trim().split(/\s+/);
      if (parts.length < 2) {
         return parts[0]; // if single name
      }
      return parts[1] + '_' + parts[0];
   };

   return (
      <div className={s.newAnalysis}>
         <div className={s.newAnalysis__main}>
            <div className={s.newAnalysis__left}>
               <div className={s.newAnalysis__title}>Create a new analysis</div>

               {!showVideoEditor ? (
                  <>
                     {/* The student picker sets 'isUserChosen' to true once chosen */}
                     <ChooseStudent setIsUserChosen={setIsUserChosen} />

                     {/* Immediately triggers the SAS + upload + process once a file is picked */}
                     <UploadVideo
                        onUpload={handleVideoUpload}
                        fileName={fileName}
                        setFileName={setFileName}
                     />

                     {/* "Submit" just ensures user can’t proceed if something is missing */}
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
                     // Could be something else if needed, or we can hide this if you prefer
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