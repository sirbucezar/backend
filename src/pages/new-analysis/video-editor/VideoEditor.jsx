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
   const [startFrame, setStartFrame] = useState(0); // Start position in frames
   const [endFrame, setEndFrame] = useState(0); // End position in frames
   const [isDraggingStart, setIsDraggingStart] = useState(false);
   const [isDraggingEnd, setIsDraggingEnd] = useState(false);
   const [isDraggingRange] = useState(false); // you had this, but it’s never used
   const [dragStartOffset] = useState(0);     // also never used
   const [frameRate, setFrameRate] = useState(30);
   const [isScrubbing, setIsScrubbing] = useState(false);
   const minFrameSelect = 10;
   const [videoLength, setVideoLength] = useState(null);
   const [lastChange, setLastChange] = useState(null);
   const [isPlaying, setIsPlaying] = useState(false);
   const [isPlayingChanged, setIsPlayingChanged] = useState(false);
   const [currentTime, setCurrentTime] = useState(0);

   // SAVE STAGE (with auto-jump to next unsaved stage)
   const saveStage = () => {
      const newStages = rubric.stages.map((stage, index) => {
         return index === currentStage
            ? { ...stage, start_time: startFrame, end_time: endFrame }
            : stage;
      });
      const newRubric = { ...rubric, stages: newStages };

      // Count how many are fully saved
      let rubricSaved = 0;
      newRubric.stages.forEach((stage) => {
         if (stage.start_time !== null && stage.end_time !== null) {
            rubricSaved++;
         }
      });
      if (rubricSaved === newStages.length) {
         setIsStagesSaved(true);
      }

      // Update the parent's rubric
      setRubric(newRubric);

      // **AUTO-JUMP** to the next unsaved stage
      // (the only new part we’re adding)
      const nextIndex = newRubric.stages.findIndex(
         (st) => st.start_time === null || st.end_time === null
      );
      if (nextIndex !== -1) {
         setCurrentStage(nextIndex);
         const nextStageData = newRubric.stages[nextIndex];
         if (nextStageData.start_time != null && nextStageData.end_time != null) {
            setStartFrame(nextStageData.start_time);
            setEndFrame(nextStageData.end_time);
         } else {
            setStartFrame(0);
            setEndFrame(videoLength);
         }
      }
   };

   const handleStageChange = (index) => {
      setLastChange(null);
      const newCurrentStage = rubric.stages[index];
      if (newCurrentStage.start_time !== null && newCurrentStage.end_time !== null) {
         setStartFrame(newCurrentStage.start_time);
         setEndFrame(newCurrentStage.end_time);
      } else {
         setStartFrame(0);
         setEndFrame(videoLength);
      }
      setCurrentStage(index);

      if (videoRef.current) {
         videoRef.current.pause();
      }
   };

   useEffect(() => {
      const video = videoRef.current;
      const handleLoadedMetadata = () => {
         setDuration(video.duration); // video duration in seconds
      };

      if (video) {
         video.addEventListener('loadedmetadata', handleLoadedMetadata);
      }
      return () => {
         if (video) {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
         }
      };
   }, []);

   useEffect(() => {
      const updateProgress = () => {
         const video = videoRef.current;
         if (video && !isScrubbing) {
            const percentage = (video.currentTime / video.duration) * 100;
            if (!isDraggingStart && !isDraggingEnd) {
               setProgress(percentage);
            }
         }
      };

      const video = videoRef.current;
      if (video) {
         video.addEventListener('timeupdate', updateProgress);
      }

      return () => {
         if (video) {
            video.removeEventListener('timeupdate', updateProgress);
         }
      };
   }, [isScrubbing, isDraggingStart, isDraggingEnd]);

   const handleScrub = (e) => {
      const track = trackRef.current;
      const video = videoRef.current;
      if (track && video) {
         const rect = track.getBoundingClientRect();
         const clientX = e.clientX || e.touches[0].clientX;
         const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
         const clickPercentage = clickX / rect.width;

         video.currentTime = clickPercentage * video.duration;
         if (!isDraggingStart && !isDraggingEnd) {
            setProgress(clickPercentage * 100);
            setCurrentTime(video.currentTime);
         }
      }
   };

   useEffect(() => {
      const video = videoRef.current;
      const handleLoadedMetadata = () => {
         // approximate frame rate
         const totalFrames = video.webkitVideoDecodedByteCount || video.duration * 30;
         setFrameRate(totalFrames / video.duration);

         const newVideoLength = Math.floor(video.duration * frameRate);
         setVideoLength(newVideoLength);
         setEndFrame(newVideoLength);
      };

      if (video) {
         video.addEventListener('loadedmetadata', handleLoadedMetadata);
      }
      return () => {
         if (video) {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
         }
      };
   }, [frameRate]);

   // (an extra “timeupdate” effect not doing much, but we’ll keep it as in original code)
   useEffect(() => {
      const updateProgress = () => {
         const video = videoRef.current;
         if (video) {
            // const percentage = (video.currentTime / video.duration) * 100;
         }
      };

      const video = videoRef.current;
      if (video) {
         video.addEventListener('timeupdate', updateProgress);
      }

      return () => {
         if (video) {
            video.removeEventListener('timeupdate', updateProgress);
         }
      };
   }, []);

   const startScrubbing = (e) => {
      setIsScrubbing(true);
      handleScrub(e);
   };

   const scrubbing = (e) => {
      if (isScrubbing) {
         handleScrub(e);
      }
   };

   const stopScrubbing = () => {
      setIsScrubbing(false);
   };

   // Keydown events for A / D / B etc.
   useEffect(() => {
      const handleKeyDown = (e) => {
         const video = videoRef.current;
         if (!video) return;

         const shiftMultiplier = e.shiftKey ? 10 : 1;
         const frameTime = 1 / frameRate;

         switch (e.key.toLowerCase()) {
            case ' ':
               e.preventDefault();
               togglePlayPause();
               break;
            case 'a':
            case 'arrowleft':
               video.currentTime = Math.max(video.currentTime - frameTime * shiftMultiplier, 0);
               break;
            case 'd':
            case 'arrowright':
               video.currentTime = Math.min(
                  video.currentTime + frameTime * shiftMultiplier,
                  duration
               );
               break;
            case 'b':
               if (lastChange) {
                  const newCurrentFrame = Math.round(video.currentTime * frameRate);
                  if (lastChange === 'start') {
                     if (endFrame - minFrameSelect > newCurrentFrame) {
                        setStartFrame(newCurrentFrame);
                     }
                  } else if (lastChange === 'end') {
                     if (startFrame + minFrameSelect < newCurrentFrame) {
                        setEndFrame(newCurrentFrame);
                     }
                  }
               }
               break;
            default:
               break;
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
         window.removeEventListener('keydown', handleKeyDown);
      };
   }, [frameRate, duration, lastChange, startFrame, endFrame]);

   // Attach & detach scrubbing events
   useEffect(() => {
      if (isScrubbing) {
         document.addEventListener('mousemove', scrubbing);
         document.addEventListener('mouseup', stopScrubbing);
         document.addEventListener('touchmove', scrubbing);
         document.addEventListener('touchend', stopScrubbing);
      } else {
         document.removeEventListener('mousemove', scrubbing);
         document.removeEventListener('mouseup', stopScrubbing);
         document.removeEventListener('touchmove', scrubbing);
         document.removeEventListener('touchend', stopScrubbing);
      }

      return () => {
         document.removeEventListener('mousemove', scrubbing);
         document.removeEventListener('mouseup', stopScrubbing);
         document.removeEventListener('touchmove', scrubbing);
         document.removeEventListener('touchend', stopScrubbing);
      };
   }, [isScrubbing]);

   // Attach & detach handleDragging for the start/end trim handles
   useEffect(() => {
      if (isDraggingStart || isDraggingEnd) {
         document.addEventListener('mousemove', handleDragging);
         document.addEventListener('mouseup', handleDragEnd);
         document.addEventListener('touchmove', handleDragging);
         document.addEventListener('touchend', handleDragEnd);
      }
      return () => {
         document.removeEventListener('mousemove', handleDragging);
         document.removeEventListener('mouseup', handleDragEnd);
         document.removeEventListener('touchmove', handleDragging);
         document.removeEventListener('touchend', handleDragEnd);
      };
   }, [isDraggingStart, isDraggingEnd]);

   const handleDragStart = (e, type) => {
      if (type === 'start') {
         setIsDraggingStart(true);
         setLastChange('start');
      } else if (type === 'end') {
         setIsDraggingEnd(true);
         setLastChange('end');
      }
   };

   const handleDragging = (e) => {
      const track = trackRef.current;
      if (track) {
         const rect = track.getBoundingClientRect();
         const clientX = e.clientX || e.touches?.[0]?.clientX;
         const positionX = Math.max(0, Math.min(clientX - rect.left, rect.width));
         const totalFrames = Math.floor(duration * frameRate);
         const newFrame = Math.round((positionX / rect.width) * totalFrames);

         if (isDraggingStart) {
            if (newFrame < endFrame - minFrameSelect) {
               handleScrub(e);
               setStartFrame(newFrame);
            }
         } else if (isDraggingEnd) {
            if (newFrame > startFrame + minFrameSelect) {
               handleScrub(e);
               setEndFrame(newFrame);
            }
         }
      }
   };

   const handleDragEnd = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = currentTime;
   };

   const calculatePositionPercentage = (frame) => {
      const totalFrames = Math.floor(duration * frameRate);
      if (!totalFrames) return 0;
      return (frame / totalFrames) * 100;
   };

   const togglePlayPause = () => {
      const video = videoRef.current;
      if (video) {
         setIsPlayingChanged(false);
         setIsPlaying((prevIsPlaying) => {
            if (prevIsPlaying) {
               video.pause();
            } else {
               video.play();
            }
            return !prevIsPlaying;
         });
         setTimeout(() => {
            setIsPlayingChanged(true);
         }, 0);
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
            {/* your local video */}
            <video
               ref={videoRef}
               src={videoSrc}
               className={s.videoEditor__video}
               controls={false}
            ></video>
            <div className={s.videoEditor__controls} onClick={togglePlayPause}>
               <button
                  className={`${s.videoEditor__playPause} ${isPlayingChanged ? s.active : ''}`}>
                  {isPlaying ? (
                     // Play icon
                     <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                           fill="#f1f1f1"
                           d="M6 3L20 12L6 21V3Z"
                           strokeWidth="2"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                        />
                     </svg>
                  ) : (
                     // Pause icon
                     <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                           fill="#f1f1f1"
                           d="M17 4H15C14.4477 4 14 4.44772 14 5V19C14 19.5523 
                              14.4477 20 15 20H17C17.5523 20 18 19.5523 
                              18 19V5C18 4.44772 17.5523 4 17 4Z"
                           strokeWidth="2"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                        />
                        <path
                           fill="#f1f1f1"
                           d="M9 4H7C6.44772 4 6 
                              4.44772 6 5V19C6 19.5523 
                              6.44772 20 7 20H9C9.55228 20 
                              10 19.5523 10 19V5C10 4.44772 
                              9.55228 4 9 4Z"
                           strokeWidth="2"
                           strokeLinecap="round"
                           strokeLinejoin="round"
                        />
                     </svg>
                  )}
               </button>
            </div>
         </div>
         <VideoTicks duration={duration} startScrubbing={startScrubbing} />
         <div ref={trackRef} className={s.videoEditor__track}>
            {/* Range Highlight */}
            <div
               className={s.videoEditor__rangeHighlight}
               style={{
                  left: `${calculatePositionPercentage(startFrame)}%`,
                  width: `${calculatePositionPercentage(endFrame - startFrame)}%`,
               }}
            ></div>
            <div>
               {/* Start Handle */}
               <div
                  className={s.videoEditor__rangeHandle}
                  style={{ left: `${calculatePositionPercentage(startFrame)}%` }}
                  onMouseDown={(e) => handleDragStart(e, 'start')}
                  onTouchStart={(e) => handleDragStart(e, 'start')}
               ></div>

               {/* End Handle */}
               <div
                  className={s.videoEditor__rangeHandle}
                  style={{ left: `${calculatePositionPercentage(endFrame)}%` }}
                  onMouseDown={(e) => handleDragStart(e, 'end')}
                  onTouchStart={(e) => handleDragStart(e, 'end')}
               ></div>
            </div>

            {/* Progress (playhead) */}
            <div className={s.videoEditor__progress} style={{ left: `${progress}%` }}>
               <div className={s.videoEditor__progressBody}>
                  <div className={s.videoEditor__progressTriangle}></div>
                  <div className={s.videoEditor__progressLine}></div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default VideoEditor;