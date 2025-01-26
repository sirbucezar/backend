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

const Sidebar = () => {
   const sidebarRef = useRef(null);
   const iconRefs = useRef([]);
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

   useEffect(() => {
      const icons = iconRefs.current;
      const dock = sidebarRef.current;

      const min = 48; // Base size + margin
      const max = 120;
      const bound = min * Math.PI;

      const updateIcons = (pointer) => {
         icons.forEach((icon, i) => {
            let distance = i * min + min / 2 - pointer;
            let scale = 1;

            if (-bound < distance && distance < bound) {
               let rad = (distance / min) * 0.5;
               scale = 1 + (max / min - 1) * Math.cos(rad);
            }

            gsap.to(icon, {
               ease: 'power4.out',
               duration: 0.5,
               width: `${40 * scale}px`,
            });
         });
      };

      const handleMouseMove = (event) => {
         let offset = dock.getBoundingClientRect().left + icons[0].offsetLeft;

         updateIcons(event.clientX - offset);
      };

      const handleMouseLeave = () => {
         gsap.to(icons, {
            ease: 'power4.out',
            duration: 0.5,
            width: '40px',
         });
      };

      dock.addEventListener('mousemove', handleMouseMove);
      dock.addEventListener('mouseleave', handleMouseLeave);

      return () => {
         dock.removeEventListener('mousemove', handleMouseMove);
         dock.removeEventListener('mouseleave', handleMouseLeave);
      };
   }, []);

   return (
      <div className={s.sidebar}>
         <div className={s.sidebar__wrapper}>
            <ul className={s.sidebar__toolbar} ref={sidebarRef}>
               {Array.from({ length: 9 }).map((_, index) => (
                  <li
                     key={index}
                     className={s.sidebar__item}
                     ref={(el) => (iconRefs.current[index] = el)}>
                     <div className={s.sidebar__icon}>
                        <img src={iconsSvg[index]} />
                     </div>
                  </li>
               ))}
            </ul>
         </div>
      </div>
   );
};

export default Sidebar;
