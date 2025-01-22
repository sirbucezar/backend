import React, { useRef, useState, useEffect } from 'react';
import s from './styles.module.scss';
import VideoTicks from './video-ticks/VideoTicks';
import VideoInfo from './video-info/VideoInfo';
import VideoStages from './video-stages/VideoStages';

const VideoEditor = ({
  videoSrc,
  setIsStagesSaved,
  rubric,
  setRubric,
  currentStageIndex,
  setCurrentStageIndex
}) => {
  // If your rubric is ever null or missing .stages, do a quick safe-check:
  if (!rubric || !rubric.stages) {
    return (
      <div className={s.videoEditor}>
        <p>No rubric data found. Please pick a sport or define your stages.</p>
      </div>
    );
  }

  const [currentStage, setCurrentStage] = useState(currentStageIndex);

  const videoRef = useRef(null);
  const trackRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startFrame, setStartFrame] = useState(0);
  const [endFrame, setEndFrame] = useState(0);

  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const [frameRate, setFrameRate] = useState(30);
  const [videoLength, setVideoLength] = useState(null);

  const [lastChange, setLastChange] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingChanged, setIsPlayingChanged] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // minimum gap in frames between start & end
  const minFrameSelect = 10;

  // Save the stage's times
  const saveStage = () => {
    const newStages = rubric.stages.map((stage, idx) =>
      idx === currentStage
        ? { ...stage, start_time: startFrame, end_time: endFrame }
        : stage
    );

    const updatedRubric = { ...rubric, stages: newStages };
    setRubric(updatedRubric);

    // Check if all stages are saved
    const allStagesSaved = newStages.every(
      (stage) => stage.start_time !== null && stage.end_time !== null
    );
    setIsStagesSaved(allStagesSaved);

    // automatically jump to the next unsaved stage
    const nextStageIdx = newStages.findIndex(
      (stage) => stage.start_time === null || stage.end_time === null
    );

    if (nextStageIdx !== -1) {
      setCurrentStage(nextStageIdx);
      setCurrentStageIndex(nextStageIdx);
      loadStageTimes(nextStageIdx, updatedRubric);
    }
  };

  // If user clicks stage # in a sidebar or something:
  const handleStageChange = (index) => {
    setLastChange(null);
    loadStageTimes(index, rubric);
    setCurrentStage(index);
    setCurrentStageIndex(index);

    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const loadStageTimes = (stageIndex, rub) => {
    const selectedStage = rub.stages[stageIndex];
    if (selectedStage.start_time !== null && selectedStage.end_time !== null) {
      setStartFrame(selectedStage.start_time);
      setEndFrame(selectedStage.end_time);
    } else {
      // if times aren't set, start at 0 -> entire video
      setStartFrame(0);
      setEndFrame(videoLength || 0);
    }
  };

  // On mount, load the initially selected stage’s times (if any)
  useEffect(() => {
    if (rubric.stages[currentStage]) {
      loadStageTimes(currentStage, rubric);
    }
    // eslint-disable-next-line
  }, []);

  // Once the <video> has metadata, set the duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // Keep track of normal progress while playing (for the “progress” line)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (!isScrubbing && !isDraggingStart && !isDraggingEnd) {
        const percentage = (video.currentTime / video.duration) * 100;
        setProgress(percentage);
      }
    };
    video.addEventListener('timeupdate', updateProgress);
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
    };
  }, [isScrubbing, isDraggingStart, isDraggingEnd]);

  // Handle scrubbing on the timeline
  const handleScrub = (e) => {
    const track = trackRef.current;
    const video = videoRef.current;
    if (track && video) {
      const rect = track.getBoundingClientRect();
      const clientX = e.clientX || e.touches?.[0]?.clientX;
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const clickPercentage = clickX / rect.width;
      video.currentTime = clickPercentage * video.duration;

      if (!isDraggingStart && !isDraggingEnd) {
        setProgress(clickPercentage * 100);
        setCurrentTime(video.currentTime);
      }
    }
  };

  // Once loaded, measure video length in frames
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      const totalFrames = video.duration * 30; // approximate
      setFrameRate(totalFrames / video.duration);

      const newVideoLength = Math.floor(video.duration * frameRate);
      setVideoLength(newVideoLength);
      setEndFrame(newVideoLength);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [frameRate]);

  // Keyboard shortcuts
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
          video.currentTime = Math.max(
            video.currentTime - frameTime * shiftMultiplier,
            0
          );
          break;
        case 'd':
        case 'arrowright':
          video.currentTime = Math.min(
            video.currentTime + frameTime * shiftMultiplier,
            duration
          );
          break;
        case 'b':
          // “b” sets the start or end frame if lastChange is set
          if (lastChange) {
            const newCurrentFrame = Math.round(video.currentTime * frameRate);
            if (lastChange === 'start') {
              if (newCurrentFrame < endFrame - minFrameSelect) {
                setStartFrame(newCurrentFrame);
              }
            } else if (lastChange === 'end') {
              if (newCurrentFrame > startFrame + minFrameSelect) {
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

  // Scrubbing “grab”
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
    // eslint-disable-next-line
  }, [isScrubbing]);

  // Dragging start/end range
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

  const handleDragStart = (e, type) => {
    if (type === 'start') {
      setIsDraggingStart(true);
      setLastChange('start');
    } else {
      setIsDraggingEnd(true);
      setLastChange('end');
    }
  };

  const handleDragging = (e) => {
    const track = trackRef.current;
    const video = videoRef.current;
    if (!track || !video) return;

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
  };

  const handleDragEnd = () => {
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
    const video = videoRef.current;
    if (video) {
      video.currentTime = currentTime;
    }
  };

  // Positioning in % on timeline
  const calculatePositionPercentage = (frame) => {
    const totalFrames = Math.floor(duration * frameRate);
    return totalFrames ? (frame / totalFrames) * 100 : 0;
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      setIsPlayingChanged(false);
      setIsPlaying((prev) => {
        if (prev) {
          video.pause();
        } else {
          video.play();
        }
        return !prev;
      });
      setTimeout(() => setIsPlayingChanged(true), 0);
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
        {/* 100% local preview src, no Azure needed */}
        <video
          ref={videoRef}
          src={videoSrc}
          className={s.videoEditor__video}
          controls={false}
        />
        <div className={s.videoEditor__controls} onClick={togglePlayPause}>
          <button
            className={`${s.videoEditor__playPause} ${isPlayingChanged ? s.active : ''}`}
          >
            {isPlaying ? (
              // Play icon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  fill="#f1f1f1"
                  d="M17 4H15C14.4477 4 14 4.44772 14 5V19C14 
                    19.5523 14.4477 20 15 20H17C17.5523 20 18 19.5523 18 
                    19V5C18 4.44772 17.5523 4 17 4Z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  fill="#f1f1f1"
                  d="M9 4H7C6.44772 4 6 4.44772 6 
                    5V19C6 19.5523 6.44772 20 7 20H9C9.55228 20 10 
                    19.5523 10 19V5C10 4.44772 9.55228 4 9 4Z"
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
        {/* Highlighted range for start->end */}
        <div
          className={s.videoEditor__rangeHighlight}
          style={{
            left: `${calculatePositionPercentage(startFrame)}%`,
            width: `${calculatePositionPercentage(endFrame - startFrame)}%`,
          }}
        ></div>

        <div>
          {/* Start handle */}
          <div
            className={s.videoEditor__rangeHandle}
            style={{ left: `${calculatePositionPercentage(startFrame)}%` }}
            onMouseDown={(e) => handleDragStart(e, 'start')}
            onTouchStart={(e) => handleDragStart(e, 'start')}
          ></div>

          {/* End handle */}
          <div
            className={s.videoEditor__rangeHandle}
            style={{ left: `${calculatePositionPercentage(endFrame)}%` }}
            onMouseDown={(e) => handleDragStart(e, 'end')}
            onTouchStart={(e) => handleDragStart(e, 'end')}
          ></div>
        </div>

        {/* Actual progress line for the playhead */}
        <div
          className={s.videoEditor__progress}
          style={{ left: `${progress}%` }}
        >
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