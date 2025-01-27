import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import Stages from './stages/Stages';
import s from './styles.module.scss';

const Feedback = ({ feedbackData, isFeedback }) => {
   let navigate = useNavigate();
   // For now, let's just keep dummy data in state
   const [isLoading, setIsLoading] = useState(true);
   const [analysisData, setAnalysisData] = useState(null);

   useEffect(() => {
      if (!isFeedback) {
         navigate('/'); // Redirect to '/'
         return;
      }
      // SIMULATE an API call with setTimeout
      // Replace with real fetch to .NET or your DB
      setTimeout(() => {
         const dummyResponse = {
            status: 'Augmentation successful',
            processing_id: '420',
            feedback: [
               {
                  stage: 'Shot Put - Stage1',
                  criterion: 'Glide phase initiated with bent low leg, back to throw',
                  score: '1',
                  confidence: '0.98',
                  feedback: {
                     Observation: {
                        title: 'Observation',
                        body: 'Your starting stance is stable and well-aligned.',
                     },
                     'Improvement Suggestion': {
                        title: 'Improvement Suggestion',
                        body: 'Practice maintaining this stance under varying conditions.',
                     },
                     Justification: {
                        title: 'Justification',
                        body: 'A consistent stance ensures power generation and prevents balance loss.',
                     },
                     Encouragement: {
                        title: 'Encouragement',
                        body: 'Great start\u2014keep this stability consistent!',
                     },
                  },
                  injury_risk: {
                     high_risk: false,
                     disclaimer: 'No significant injury risk noted. Warm up thoroughly.',
                  },
                  visualization_tip: 'Imagine your lower body as a solid foundation for the throw.',
               },
               {
                  stage: 'Shot Put - Stage2',
                  criterion: 'Trailing leg pulled under pelvis after hop',
                  score: '0.5',
                  confidence: '0.75',
                  feedback: {
                     Observation: {
                        title: 'Observation',
                        body: 'The trailing leg was not fully aligned under the pelvis.',
                     },
                     'Improvement Suggestion': {
                        title: 'Improvement Suggestion',
                        body: 'Focus on drills that emphasize leg alignment during the hop.',
                     },
                     Justification: {
                        title: 'Justification',
                        body: 'Aligning the trailing leg helps transfer power more efficiently.',
                     },
                     Encouragement: {
                        title: 'Encouragement',
                        body: 'Almost there! Just a little more focus on leg positioning.',
                     },
                  },
                  injury_risk: {
                     high_risk: false,
                     disclaimer:
                        'Minor risk of strain if misalignment continues. Focus on proper form.',
                  },
                  visualization_tip:
                     'Visualize your legs forming a straight line during the hop phase.',
               },
               {
                  stage: 'Shot Put - Stage3',
                  criterion: 'Bracing leg planted; push leg bent after hop',
                  score: '0',
                  confidence: '0.6',
                  feedback: {
                     Observation: {
                        title: 'Observation',
                        body: 'The bracing leg was not firmly planted, affecting balance.',
                     },
                     'Improvement Suggestion': {
                        title: 'Improvement Suggestion',
                        body: 'Work on drills to strengthen your bracing leg stability.',
                     },
                     Justification: {
                        title: 'Justification',
                        body: 'A planted bracing leg provides stability for a strong push-off.',
                     },
                     Encouragement: {
                        title: 'Encouragement',
                        body: 'Don\u2019t give up\u2014focus on planting that leg consistently!',
                     },
                  },
                  injury_risk: {
                     high_risk: true,
                     disclaimer:
                        'Improper bracing could strain the knee joint. Proceed with caution.',
                  },
                  visualization_tip:
                     'Imagine your bracing leg acting like an anchor, holding you steady.',
               },
               {
                  stage: 'Shot Put - Stage4',
                  criterion: 'Push leg extends, hip-torso-arm sequence begins',
                  score: '1',
                  confidence: '0.92',
                  feedback: {
                     Observation: {
                        title: 'Observation',
                        body: 'The hip-to-arm sequence was well-timed and powerful.',
                     },
                     'Improvement Suggestion': {
                        title: 'Improvement Suggestion',
                        body: 'Focus on maintaining this timing for consistency.',
                     },
                     Justification: {
                        title: 'Justification',
                        body: 'Proper sequence ensures maximum force transfer to the shot.',
                     },
                     Encouragement: {
                        title: 'Encouragement',
                        body: 'Fantastic job\u2014your sequence is setting you up for success!',
                     },
                  },
                  injury_risk: {
                     high_risk: false,
                     disclaimer: 'No significant injury risk noted. Keep up the good work!',
                  },
                  visualization_tip:
                     'Picture the force traveling seamlessly from your hips to your arm.',
               },
               {
                  stage: 'Shot Put - Stage5',
                  criterion: 'Shot remains at neck until 45\u00b0 release',
                  score: '1',
                  confidence: '0.98',
                  feedback: {
                     Observation: {
                        title: 'Observation',
                        body: 'Your release angle was optimal, and the shot stayed in position.',
                     },
                     'Improvement Suggestion': {
                        title: 'Improvement Suggestion',
                        body: 'Continue practicing release angles to maintain consistency.',
                     },
                     Justification: {
                        title: 'Justification',
                        body: 'A proper release angle maximizes shot trajectory and distance.',
                     },
                     Encouragement: {
                        title: 'Encouragement',
                        body: 'Excellent release! Your hard work is paying off.',
                     },
                  },
                  injury_risk: {
                     high_risk: false,
                     disclaimer: 'Ensure proper wrist and arm alignment to prevent strain.',
                  },
                  visualization_tip:
                     'Visualize the shot traveling in a smooth arc towards the target.',
               },
            ],
         };

         setAnalysisData(dummyResponse);
         setIsLoading(false);
      }, 1200);

      console.log('Server says:', feedbackData);
   }, []);

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
            <h1 className={s.feedback__title}>Rubric: Shot Put</h1>
            <div className={s.feedback__score}>{overallScore}/5</div>
         </div>

         {/* Render stage cards */}
         <Stages stageEntries={stageEntries} />
      </div>
   );
};

export default Feedback;
