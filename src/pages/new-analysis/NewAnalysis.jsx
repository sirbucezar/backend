import React, { useEffect, useState } from 'react';
import s from './styles.module.scss';
import UploadVideo from './upload-video/UploadVideo';
import ChooseStudent from './choose-student/ChooseStudent';
import Rubrics from './rubrics/Rubrics';
import VideoEditor from './video-editor/VideoEditor';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import Sidebar from './sidebar/Sidebar';
import VideoCut from './video-cut/VideoCut ';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const NewAnalysis = ({ showVideoEditor, setShowVideoEditor }) => {
   const [ffmpeg, setFfmpeg] = useState(createFFmpeg({ log: false }));
   // Student, Sport, and local video states
   const [selectedStudent, setSelectedStudent] = useState('');
   const [currentRubric, setCurrentRubric] = useState(null);
   const [videoSrc, setVideoSrc] = useState('');
   const [fileName, setFileName] = useState(null);
   const [rawFile, setRawFile] = useState(null);
   const [showVideoCut, setShowVideoCut] = useState(false);

   const [easterEgg, setEasterEgg] = useState(['', 0]);
   let navigate = useNavigate();

   // SAS + “Analyze” workflow
   const [sasUrl, setSasUrl] = useState(null);
   const [isStagesSaved, setIsStagesSaved] = useState(false);
   const [isLoading, setIsLoading] = useState(false);

   // cut time
   const [fromTime, setFromTime] = useState('0:00');
   const [toTime, setToTime] = useState('0:00');

   const [startFrame, setStartFrame] = useState(0); // Start position in frames
   const [endFrame, setEndFrame] = useState(0); // End position in frames
   const [isDurationValid, setIsDurationValid] = useState(false);

   // Local “rubric” with 5 stages that store frames, not timestamps
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

   useEffect(() => {
      // Warn user before leaving page (only before form submission)
      const handleBeforeUnload = (event) => {
         if (showVideoEditor) {
            event.preventDefault();
            event.returnValue = ''; // Standard browser behavior
         }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
         window.removeEventListener('beforeunload', handleBeforeUnload);
      };
   }, [showVideoEditor]);

   const handleVideoUpload = (file) => {
      if (file) {
         const newFileName = file.name; // Access the file name

         if (file.type.startsWith('video')) {
            const videoElement = document.createElement('video');
            videoElement.preload = 'metadata';

            videoElement.onloadedmetadata = () => {
               window.URL.revokeObjectURL(videoElement.src);

               if (videoElement.duration > 30) {
                  toast.error(
                     `The uploaded video "${newFileName}" exceeds 30 seconds, please cut it in editor`,
                  );
                  setShowVideoCut(true); // Show video cut component
                  const fileURL = URL.createObjectURL(file);
                  setVideoSrc(fileURL);
                  setRawFile(file);
               } else {
                  console.log(`The uploaded video "${newFileName}" is within the allowed time.`);
                  const fileURL = URL.createObjectURL(file);
                  setVideoSrc(fileURL);
                  setFileName(file.name);
                  setRawFile(file);
               }
            };

            videoElement.src = URL.createObjectURL(file);
         } else {
            toast.error('Please upload a video my little friend :D');
            setFileName(null);
         }
      }

      // toast.success(`Video ${file.name} was selected!`);

      // * local
      // setShowVideoEditor(true);
   };

   const handleSubmit = async (e) => {
      e.preventDefault();

      if (!selectedStudent) {
         toast.error('Please choose a student first');
         return;
      } else if (!currentRubric) {
         toast.error('Pick a rubric to evaluate on');
         return;
      } else if (!fileName) {
         toast.error('Please upload a video first');
         return;
      }

      // * local
      // setShowVideoEditor(true);
      // return;

      // Actually do the upload
      try {
         setIsLoading(true);
         toast.info('Getting SAS token...');

         const sas = await getSasForFile(fileName);
         toast.success('SAS received. Uploading video...');

         await uploadFileToBlob(rawFile, sas);
         toast.success('Upload complete!');
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

   const handleAnalyze = async () => {
      // must have all 5 stages saved
      if (!isStagesSaved) {
         toast.error('Please save all 5 stages before analyzing');
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
      console.log(payload);

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

   const handleTitleClick = () => {
      if (easterEgg[0].length > easterEgg[1]) {
         const newEasterEgg = [easterEgg[0], easterEgg[1] + 1];
         toast.info(easterEgg[0][easterEgg[1]]);
         setEasterEgg(newEasterEgg);
      }
   };

   const handleSaveVideo = async () => {
      if (!crossOriginIsolated) {
         toast.error('Cross-origin isolation is required for video processing.');
         console.error('Cross-origin isolation is not enabled.');
         return;
      }

      if (!rawFile || startFrame >= endFrame) {
         toast.error('Invalid trimming selection');
         return;
      }

      if (!ffmpeg.isLoaded()) {
         toast.info('Loading video processing engine...');
         await ffmpeg.load();
      }

      try {
         toast.info('Trimming video, please wait...');

         // Convert start and end frames to seconds (assuming 30 fps)
         const startSeconds = startFrame / 30;
         const endSeconds = endFrame / 30;

         // Extract file extension from original file name
         const fileExtension = fileName.split('.').pop();
         const inputFileName = `input.${fileExtension}`;
         const outputFileName = `trimmed_${fileName}`;

         // Load the uploaded video into FFmpeg's virtual file system
         ffmpeg.FS('writeFile', inputFileName, await fetchFile(rawFile));

         // Execute FFmpeg command to trim the video
         await ffmpeg.run(
            '-i',
            inputFileName,
            '-ss',
            startSeconds.toString(),
            '-to',
            endSeconds.toString(),
            '-c',
            'copy',
            outputFileName,
         );

         // Retrieve the trimmed video from FFmpeg's file system
         const trimmedData = ffmpeg.FS('readFile', outputFileName);

         // Create a Blob from the output file and generate a URL
         const trimmedBlob = new Blob([trimmedData.buffer], { type: rawFile.type });
         const trimmedUrl = URL.createObjectURL(trimmedBlob);

         // Set the new trimmed video details
         setVideoSrc(trimmedUrl);
         setFileName(outputFileName);
         setRawFile(trimmedBlob);
         setShowVideoCut(false);

         toast.success(`Video trimmed successfully as ${outputFileName}`);
      } catch (error) {
         toast.error('Error trimming video');
         console.error('FFmpeg error:', error);
      }
   };

   return (
      <div className={s.newAnalysis}>
         {!showVideoEditor && <Sidebar />}
         <div className={s.newAnalysis__main}>
            {!showVideoCut && (
               <div className={s.newAnalysis__left}>
                  <div className={s.newAnalysis__title} onClick={handleTitleClick}>
                     Create a new analysis
                  </div>
                  {!showVideoEditor ? (
                     <div>
                        <ChooseStudent setSelectedStudent={setSelectedStudent} />
                        <UploadVideo
                           onUpload={handleVideoUpload}
                           fileName={fileName}
                           setFileName={setFileName}
                        />
                        <form action="#" onSubmit={handleSubmit}>
                           <button
                              type="submit"
                              className={s.newAnalysis__submit}
                              disabled={isLoading}>
                              {isLoading ? 'Uploading...' : 'Submit'}
                           </button>
                        </form>
                     </div>
                  ) : (
                     <button
                        className={s.newAnalysis__submit}
                        onClick={handleAnalyze}
                        disabled={isLoading}>
                        {isLoading ? 'Processing...' : 'Analyze'}
                     </button>
                  )}
               </div>
            )}
            {showVideoEditor ? (
               <VideoEditor
                  videoSrc={videoSrc}
                  setIsStagesSaved={setIsStagesSaved}
                  rubric={rubric}
                  setRubric={setRubric}
                  startFrame={startFrame}
                  setStartFrame={setStartFrame}
                  endFrame={endFrame}
                  setEndFrame={setEndFrame}
               />
            ) : showVideoCut ? (
               <VideoEditor
                  isVideoCut={true}
                  videoSrc={videoSrc}
                  setIsStagesSaved={setIsStagesSaved}
                  rubric={rubric}
                  setRubric={setRubric}
                  fromTime={fromTime}
                  setFromTime={setFromTime}
                  toTime={toTime}
                  setToTime={setToTime}
                  startFrame={startFrame}
                  setStartFrame={setStartFrame}
                  endFrame={endFrame}
                  setEndFrame={setEndFrame}
                  isDurationValid={isDurationValid}
                  setIsDurationValid={setIsDurationValid}
               />
            ) : (
               <Rubrics currentRubric={currentRubric} setCurrentRubric={setCurrentRubric} />
            )}
            {showVideoCut && (
               <div className={s.newAnalysis__right}>
                  <div className={s.newAnalysis__cutTitle}>Cut the video</div>
                  <p className={s.newAnalysis__descr}>
                     Video is too long, please cut it to 30 seconds
                  </p>
                  <div className={s.newAnalysis__time}>
                     <div className={s.newAnalysis__cut}>
                        From <span>{fromTime}</span>
                     </div>
                     <div className={s.newAnalysis__cut}>
                        To <span>{toTime}</span>
                     </div>
                  </div>
                  <button
                     className={s.newAnalysis__cutBtn}
                     onClick={handleSaveVideo}
                     disabled={!isDurationValid}>
                     Save video
                  </button>
               </div>
            )}
         </div>
      </div>
   );
};

export default NewAnalysis;
