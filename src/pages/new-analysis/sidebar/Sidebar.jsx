import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import s from './styles.module.scss';
import discursThrow from '/icons/discus throw.svg';
import highJump from '/icons/high jump.svg';
import hurdles from '/icons/hurdles 2.0.svg';
import javelinThrow from '/icons/javelin throw.svg';
import longJump from '/icons/long jump 2.0.svg';
import relayRace from '/icons/relay race 2.0.svg';
import shotPot from '/icons/shot pot 2.0.svg';
import sprint from '/icons/sprint.svg';
import startTecchnique from '/icons/start tecchnique.svg';
import { toast } from 'sonner';

const Sidebar = ({ rubrics, currentRubric, setCurrentRubric }) => {
   const iconsSvg = [
      startTecchnique,
      sprint,
      shotPot,
      highJump,
      hurdles,
      longJump,
      discursThrow,
      javelinThrow,
      relayRace,
   ];

   const dockRef = useRef(null);
   const iconRefs = useRef([]);

   useEffect(() => {
      const icons = iconRefs.current;
      const dock = dockRef.current;
      const min = 60 + 16; // width + margin
      const max = 170;
      const bound = min * Math.PI;

      gsap.set(icons, {
         transformOrigin: '0% -50%',
         height: 40,
      });

      gsap.set(dock, {
         position: 'relative',
      });

      const updateIcons = (pointer) => {
         icons.forEach((icon, i) => {
            let distance = i * min + min / 2 - pointer;
            let y = 0;
            let scale = 1;

            if (-bound < distance && distance < bound) {
               let rad = (distance / min) * 0.5;
               scale = 1 + (max / min - 1) * Math.cos(rad);
               y = 2 * (max - min) * Math.sin(rad);
            } else {
               y = (-bound < distance ? 2 : -2) * (max - min);
            }

            gsap.to(icon, {
               duration: 0.3,
               y: y,
               scale: scale,
            });
         });
      };

      const handleMouseMove = (event) => {
         let offset = dock.getBoundingClientRect().top + icons[0].offsetTop;
         updateIcons(event.clientY - offset);
      };

      const handleMouseLeave = () => {
         gsap.to(icons, {
            duration: 0.3,
            scale: 1,
            y: 0,
         });
      };

      dock.addEventListener('mousemove', handleMouseMove);
      dock.addEventListener('mouseleave', handleMouseLeave);

      return () => {
         dock.removeEventListener('mousemove', handleMouseMove);
         dock.removeEventListener('mouseleave', handleMouseLeave);
      };
   }, []);

   const handleRubricClick = (rubric) => {
      setCurrentRubric(rubric);
      toast.success(`Rubric ${rubric.name} is chosen`);
   };

   return (
      <div className={s.sidebar}>
         <div className={s.sidebar__wrapper}>
            <ul className={s.sidebar__toolbar} ref={dockRef}>
               {iconsSvg.map((icon, index) => (
                  <li
                     key={index}
                     onClick={() =>
                        handleRubricClick({ id: rubrics[index].id, name: rubrics[index].name })
                     }
                     className={`${s.sidebar__item} ${
                        currentRubric?.id === rubrics[index].id ? s.active : ''
                     }`}
                     ref={(el) => (iconRefs.current[index] = el)}>
                     <div className={s.sidebar__icon}>
                        <img src={icon} alt={`icon-${index}`} />
                     </div>
                     <div className={s.sidebar__title}>{rubrics[index].name}</div>
                  </li>
               ))}
            </ul>
         </div>
      </div>
   );
};

export default Sidebar;
