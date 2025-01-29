import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import Stages from './stages/Stages';
import s from './styles.module.scss';
import LoadingScreen from './loading-screen/LoadingScreen';
import { Link } from 'react-router';

const Feedback = ({ feedbackData, isFeedback, currentRubric }) => {
   let navigate = useNavigate();
   // For now, let's just keep dummy data in state
   const [isLoading, setIsLoading] = useState(true);
   const [isLoadingShown, setIsLoadingShown] = useState(true);
   const [isExploding, setIsExploding] = useState(false);
   const [analysisData, setAnalysisData] = useState(null);

   useEffect(() => {
      if (isExploding) {
         setTimeout(() => {
            setIsLoadingShown(false);
         }, 500);
      }
   }, [isExploding]);

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
            processing_id: '421',
            feedback: [
               {
                  stage: 'Shot Put - Stage1',
                  criterion: 'Glide phase initiated with bent low leg, back to throw',
                  score: '1',
                  confidence: '0.90',
                  feedback: {
                     Observation: {
                        title: 'Observation',
                        body: 'Your low leg remains properly bent, creating an explosive, controlled glide backward.',
                     },
                     'Improvement Suggestion': {
                        title: 'Improvement Suggestion',
                        body: 'Maintain that approach; add plyometric exercises to further enhance your starting leg power.',
                     },
                     Justification: {
                        title: 'Justification',
                        body: 'A sustained bend optimizes hip-knee-ankle alignment, driving a powerful transition into the power stance.',
                     },
                     Encouragement: {
                        title: 'Encouragement',
                        body: 'Great setup—keeping that leg flexed at the start is fueling a dynamic glide every time.',
                     },
                  },
                  injury_risk: {
                     high_risk: false,
                     disclaimer: 'No significant injury risk noted. Keep executing with control.',
                  },
                  visualization_tip:
                     'Imagine storing power in your bent leg like a compressed spring before pushing off.',
               },
               {
                  stage: 'Shot Put - Stage2',
                  criterion: 'Trailing leg pulled under pelvis after hop',
                  score: '0.5',
                  confidence: '0.74',
                  feedback: {
                     Observation: {
                        title: 'Observation',
                        body: 'You sometimes manage to tuck the trailing leg under, but it’s inconsistent and timing varies.',
                     },
                     'Improvement Suggestion': {
                        title: 'Improvement Suggestion',
                        body: 'Use rhythmic drills: hop and count ‘one-two,’ ensuring the leg tucks under on ‘two’ every time.',
                     },
                     Justification: {
                        title: 'Justification',
                        body: 'Consistent leg tuck helps you land in a strong power position, stabilizing your body for the put.',
                     },
                     Encouragement: {
                        title: 'Encouragement',
                        body: 'You’re halfway there—sharpen that timing, and the rest of the throw will feel smoother.',
                     },
                  },
                  injury_risk: {
                     high_risk: false,
                     disclaimer: 'Minor risk of imbalance. Focus on controlled foot placement.',
                  },
                  visualization_tip:
                     'Visualize snapping your trailing foot underneath like a pendulum swinging into place.',
               },
               {
                  stage: 'Shot Put - Stage3',
                  criterion: 'Bracing leg planted; push leg bent after hop',
                  score: '0',
                  confidence: '0.76',
                  feedback: {
                     Observation: {
                        title: 'Observation',
                        body: 'Your front (bracing) leg drifts forward without proper contact, and the push leg remains too straight.',
                     },
                     'Improvement Suggestion': {
                        title: 'Improvement Suggestion',
                        body: 'Consciously drive your front foot into the ground; keep your back knee flexed for a stronger drive.',
                     },
                     Justification: {
                        title: 'Justification',
                        body: 'A solid front plant anchors your body, while a bent push leg coils energy for the final extension.',
                     },
                     Encouragement: {
                        title: 'Encouragement',
                        body: 'No worries—nailing that front-back leg setup will drastically boost throw consistency.',
                     },
                  },
                  injury_risk: {
                     high_risk: true,
                     disclaimer:
                        'Improper bracing could strain the knee joint. Proceed with caution.',
                  },
                  visualization_tip:
                     'Picture your bracing leg as an anchor keeping you grounded while the push leg builds power.',
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
                        body: 'Fantastic job—your sequence is setting you up for success!',
                     },
                  },
                  injury_risk: {
                     high_risk: false,
                     disclaimer: 'No significant injury risk noted. Keep up the good work!',
                  },
                  visualization_tip:
                     'Picture the force traveling seamlessly from your hips to your arm in one fluid motion.',
               },
               {
                  stage: 'Shot Put - Stage5',
                  criterion: 'Shot remains at neck until 45° release',
                  score: '1',
                  confidence: '0.90',
                  feedback: {
                     Observation: {
                        title: 'Observation',
                        body: 'You consistently secure the shot at your neck and fire it at a textbook 45°, maximizing distance.',
                     },
                     'Improvement Suggestion': {
                        title: 'Improvement Suggestion',
                        body: 'Keep refining your rhythm—slight changes in hip drive or speed might tweak the release angle perfectly.',
                     },
                     Justification: {
                        title: 'Justification',
                        body: 'A well-timed 45° launch uses gravity and forward velocity for a long flight path with minimal energy loss.',
                     },
                     Encouragement: {
                        title: 'Encouragement',
                        body: 'Fantastic work—your shot put form is an excellent blend of power and precision!',
                     },
                  },
                  injury_risk: {
                     high_risk: false,
                     disclaimer: 'Ensure proper wrist and arm alignment to prevent strain.',
                  },
                  visualization_tip:
                     'Visualize the shot traveling in a smooth arc towards the target at a perfect 45° angle.',
               },
            ],
         };

         setAnalysisData(dummyResponse);
         setIsLoading(false);
      }, 4000);

      console.log('Server says:', analysisData);
   }, []);

   // if (isLoading) {
   //    return (

   //    );
   // }

   // if (!analysisData) {
   //    return;
   // }

   // useEffect(() => {}, [analysisData]);

   //    // const { stageAnalysis, metrics } = analysisData;
   //    // const overallScore = metrics?.overall_score ?? 0;

   //    // Convert stageAnalysis object to an array of stage details
   //    // const stageEntries = Object.keys(stageAnalysis).map((stageKey) => ({
   //    //    name: stageKey,
   //    //    score: stageAnalysis[stageKey]?.score,
   //    //    videoUrl: stageAnalysis[stageKey]?.video_url,
   //    //    feedback: stageAnalysis[stageKey]?.feedback,
   //    //    confidence: stageAnalysis[stageKey]?.confidence,
   //    // }));

   useEffect(() => {
      // Warn user before leaving page (only before form submission)
      const handleBeforeUnload = (event) => {
         if (isFeedback) {
            event.preventDefault();
            event.returnValue = ''; // Standard browser behavior
         }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
         window.removeEventListener('beforeunload', handleBeforeUnload);
      };
   }, [isFeedback]);

   return (
      <>
         {isLoadingShown && (
            <div className={s.loading}>
               <LoadingScreen
                  isExploding={isExploding}
                  setIsExploding={setIsExploding}
                  isLoading={isLoading}
                  currentRubric={currentRubric}
               />
            </div>
         )}
         {!isLoading && (
            <div className={s.feedback}>
               <div className={s.feedback__top}>
                  <h1 className={s.feedback__title}>Rubric: {currentRubric.name}</h1>
                  <div className={s.feedback__score}>4/5</div>
               </div>

               {/* Render stage cards */}
               {/* {!!analysisData && } */}
               <Stages stageEntries={analysisData.feedback} />
               <div className={s.feedback__bottom}>
                  <Link to="/" className={s.feedback__btnNew}>
                     New analysis
                  </Link>
                  {/* <button className={s.feedback__btn}>Download report</button> */}
               </div>
            </div>
         )}
      </>
   );
};

export default Feedback;
