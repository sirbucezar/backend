import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import s from './styles.module.scss';

const BorderSnakeAnimation = ({ color, isExpanded }) => {
  return (
    <motion.div
      className={s.borderAnimation}
      initial={{ strokeDashoffset: 500 }}
      animate={{ strokeDashoffset: isExpanded ? 0 : 500 }}
      transition={{ duration: 4, ease: "easeInOut" }}
      style={{
        borderColor: color,
      }}
    />
  );
};

const Stages = ({ stageEntries, videoWidth = '100%', videoHeight = '350px' }) => {
   const [expandedStage, setExpandedStage] = useState(null);
   const [isFullyExpanded, setIsFullyExpanded] = useState(false);
   const [animateStages, setAnimateStages] = useState(false);
   const originalPositionRef = useRef(null);

   useEffect(() => {
      setAnimateStages(true);
    }, []);

   const getStageClass = (score) => {
     if (score === 0) return s.red;
     if (score === 0.5) return s.purple;
     if (score === 1) return s.green;
     return '';
   };

   const getScoreTagClass = (score) => {
      if (score === 0) return s.tagRed;
      if (score === 0.5) return s.tagPurple;
      if (score === 1) return s.tagGreen;
      return s.tagDefault;
   };

   const getBorderColor = (score) => {
     if (score === 0) return '#d93030';
     if (score === 0.5) return '#8638eb';
     if (score === 1) return '#2ecc71';
     return 'transparent';
   };

   const handleStageClick = (index, event) => {
     const rect = event.currentTarget.getBoundingClientRect();
     originalPositionRef.current = rect;
     setExpandedStage(index);
   };

   const handleClose = () => {
     setIsFullyExpanded(false);
     setTimeout(() => {
       setExpandedStage(null);
     }, 300);
   };

   return (
     <div className={s.stages}>
       <ul className={s.stages__list}>
         {stageEntries.map((stage, index) => (
           <motion.li
             key={index}
             ref={index === expandedStage ? originalPositionRef : null}
             className={`${s.stages__item} ${getStageClass(stage.score)}`}
             onClick={(e) => handleStageClick(index, e)}
             initial={{ scale: 1 }}
             animate={animateStages ? { scale: [1, 1.8, 1] } : {}}
             transition={{
               duration: 0.2,
               delay: index * 0.1,
             }}
           >
             {stage.name.toUpperCase()}
           </motion.li>
         ))}
       </ul>

       <AnimatePresence>
         {expandedStage !== null && (
           <>
             <motion.div
               className={s.stages__overlay}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={handleClose}
             />

             <motion.li
               className={`
                 ${s.stages__item}
                 ${s.stages__itemExpanded}
                 ${getStageClass(stageEntries[expandedStage].score)}
               `}
               initial={{ 
                 top: originalPositionRef.current?.top || 0,
                 left: originalPositionRef.current?.left || 0,
                 width: originalPositionRef.current?.width || 0,
                 height: originalPositionRef.current?.height || 0,
                 border: '6px solid transparent'
               }}
               animate={{ 
                 top: '14%',
                 left: '14%',
                 width: '80%',
                 height: 'auto',
                 border: '6px solid transparent',
                 transition: {
                   type: 'tween',
                   duration: 0.4,
                   ease: "easeOut",
                   onComplete: () => setIsFullyExpanded(true)
                 }
               }}
               exit={{ 
                top: originalPositionRef.current?.top || 0,
                left: originalPositionRef.current?.left || 0,
                width: originalPositionRef.current?.width || -50,
                height: 0,  // Collapse the height to merge top/bottom borders
                opacity: 0,
                borderTop: '6px solid transparent', 
                borderBottom: '6px solid transparent',  // Keep bottom border visible initially
                borderLeft: '0px solid transparent',
                borderRight: '0px solid transparent',
                transition: { 
                  duration: 0.3,
                  ease: "easeInOut"
                }
              }}
             >
               <BorderSnakeAnimation 
                  color={getBorderColor(stageEntries[expandedStage].score)}
                  isExpanded={isFullyExpanded}
               />
               
               <button className={s.closeButton} onClick={handleClose}>x</button>

               {isFullyExpanded && (
                 <motion.div 
                   className={s.expandedStage__content}
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 0.3 }}
                 >
                   <div className={s.expandedStage__left}>
                     <h2 className={s.expandedStage__title}>
                       {stageEntries[expandedStage].name.toUpperCase()}
                     </h2>

                     <div className={s.expandedStage__tags}>
                       <span className={`${s.tag} ${getScoreTagClass(stageEntries[expandedStage].score)}`}>
                         Score: {stageEntries[expandedStage].score}
                       </span>
                     </div>

                     <div className={s.expandedStage__divider}></div>

                     <h3 className={s.expandedStage__feedbackTitle}>Feedback:</h3>
                     <p className={s.expandedStage__feedbackText}>
                       {stageEntries[expandedStage].feedback}
                     </p>
                   </div>

                   <div className={s.expandedStage__right}>
                     <video
                       src={stageEntries[expandedStage].videoUrl}
                       controls
                       style={{ width: videoWidth, height: videoHeight }}
                       className={s.stages__video}
                     />
                   </div>
                 </motion.div>
               )}
             </motion.li>
           </>
         )}
       </AnimatePresence>
     </div>
   );
};

export default Stages;