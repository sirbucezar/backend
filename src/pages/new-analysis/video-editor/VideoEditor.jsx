import React, { useRef, useState, useEffect } from 'react';
import s from './styles.module.scss';
import VideoTicks from './video-ticks/VideoTicks';
import VideoInfo from './video-info/VideoInfo';
import VideoStages from './video-stages/VideoStages';

const VideoEditor = ({ videoSrc, setIsStagesSaved, rubric, setRubric }) => {
   const [currentStage, setCurrentStage] = useState(0);

   const videoRef = useRef(null);
   const trackRef = useRef(null);
   const [progress, setProgress] = useState(0);
   const [duration, setDuration] = useState(0);
   const [startFrame, setStartFrame] = useState(0);
   const [endFrame, setEndFrame] = useState(0);
   const [isDraggingStart, setIsDraggingStart] = useState(false);
   const [isDraggingEnd, setIsDraggingEnd] = useState(false);
   const [isScrubbing, setIsScrubbing] = useState(false);
   const minFrameSelect = 1;
   const [frameRate, setFrameRate] = useState(30);
   const [videoLength, setVideoLength] = useState(null);
   const [lastChange, setLastChange] = useState(null);

   const saveStage = () => {
      const newStages = rubric.stages.map((stage, index) =>
         index === currentStage ? { ...stage, start_time: startFrame, end_time: endFrame } : stage
      );
      setRubric({ ...rubric, stages: newStages });
      
      const allStagesSaved = newStages.every(stage => stage.start_time !== null && stage.end_time !== null);
      setIsStagesSaved(allStagesSaved);
      
      const nextStageIndex = newStages.findIndex(stage => stage.start_time === null || stage.end_time === null);
      if (nextStageIndex !== -1) {
         setCurrentStage(nextStageIndex);
      }
   };

   const handleStageChange = (index) => {
      setLastChange(null);
      const newCurrentStage = rubric.stages[index];
      setStartFrame(newCurrentStage.start_time || 0);
      setEndFrame(newCurrentStage.end_time || videoLength);
      setCurrentStage(index);
      if (videoRef.current) {
         videoRef.current.pause();
      }
   };

   useEffect(() => {
      const video = videoRef.current;
      if (video) {
         video.addEventListener('loadedmetadata', () => setDuration(video.duration));
         return () => video.removeEventListener('loadedmetadata', () => setDuration(video.duration));
      }
   }, []);

   useEffect(() => {
      const video = videoRef.current;
      if (video) {
         video.addEventListener('timeupdate', () => {
            if (!isScrubbing && !isDraggingStart && !isDraggingEnd) {
               setProgress((video.currentTime / video.duration) * 100);
            }
         });
         return () => video.removeEventListener('timeupdate', () => setProgress((video.currentTime / video.duration) * 100));
      }
   }, [isScrubbing, isDraggingStart, isDraggingEnd]);

   const togglePlayPause = () => {
      if (videoRef.current) {
         videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
      }
   };

   return (
      <div className={s.videoEditor}>
         <VideoStages
            rubric={rubric}
            setRubric={setRubric}
            currentStage={currentStage}
            setCurrentStage={setCurrentStage}
            saveStage={saveStage}
            handleStageChange={handleStageChange}
         />
         <div className={s.videoEditor__body}>
            <VideoInfo />
            <video ref={videoRef} src={videoSrc} className={s.videoEditor__video} controls={false}></video>
            <div className={s.videoEditor__controls} onClick={togglePlayPause}>
               <button>{videoRef.current?.paused ? 'Play' : 'Pause'}</button>
            </div>
         </div>
         <VideoTicks duration={duration} />
      </div>
   );
};

export default VideoEditor;