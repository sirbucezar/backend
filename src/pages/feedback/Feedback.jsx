import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import Stages from './stages/Stages';
import s from './styles.module.scss';

const Feedback = () => {
   const { userId, rubricId } = useParams();

   // For now, let's just keep dummy data in state
   const [isLoading, setIsLoading] = useState(true);
   const [analysisData, setAnalysisData] = useState(null);

   useEffect(() => {
      // SIMULATE an API call with setTimeout
      // Replace with real fetch to .NET or your DB
      setTimeout(() => {
         const dummyResponse = {
            stageAnalysis: {
               stage1: {
                  score: 0,
                  video_url: 'http://techslides.com/demos/sample-videos/small.mp4',
                  feedback: 'Needs improvement',
                  confidence: 0.5,
               },
               stage2: {
                  score: 0.5,
                  video_url: 'http://techslides.com/demos/sample-videos/small.mp4',
                  feedback: 'Getting better',
                  confidence: 0.7,
               },
               stage3: {
                  score: 1,
                  video_url: 'http://techslides.com/demos/sample-videos/small.mp4',
                  feedback: 'Great technique',
                  confidence: 0.9,
               },
               stage4: {
                  score: 0.5,
                  video_url: 'http://techslides.com/demos/sample-videos/small.mp4',
                  feedback: 'Great technique',
                  confidence: 0.1,
               },
               stage5: {
                  score: 1,
                  video_url: 'http://techslides.com/demos/sample-videos/small.mp4',
                  feedback: 'Great technique',
                  confidence: 0.8,
               },
            },
            metrics: {
               overall_score: 3, // total out of 5
            },
         };

         setAnalysisData(dummyResponse);
         setIsLoading(false);
      }, 1200);
   }, [userId, rubricId]);

   if (isLoading) {
      return <div className={s.loading}>Loading feedback...</div>;
   }

   if (!analysisData) {
      return <div className={s.error}>Could not find analysis data.</div>;
   }

   const { stageAnalysis, metrics } = analysisData;
   const overallScore = metrics?.overall_score ?? 0;

   // Convert stageAnalysis object to an array of stage details
   const stageEntries = Object.keys(stageAnalysis).map((stageKey) => ({
      name: stageKey,
      score: stageAnalysis[stageKey]?.score,
      videoUrl: stageAnalysis[stageKey]?.video_url,
      feedback: stageAnalysis[stageKey]?.feedback,
      confidence: stageAnalysis[stageKey]?.confidence,
   }));

   return (
      <div className={s.feedback}>
         <div className={s.feedback__top}>
            <h1 className={s.feedback__title}>
               User: {userId}, Rubric: {rubricId}
            </h1>
            <div className={s.feedback__score}>{overallScore}/5</div>
         </div>

         {/* Render stage cards */}
         <Stages stageEntries={stageEntries} />
      </div>
   );
};

export default Feedback;
