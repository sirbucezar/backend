import React, { useEffect, useRef } from 'react';
import s from './styles.module.scss';
import gsap from 'gsap';

const Sidebar = () => {
   const sidebarRef = useRef(null);
   const iconRefs = useRef([]);

   useEffect(() => {
      const icons = iconRefs.current;
      const dock = sidebarRef.current;

      let min = 48; // 40 + margin
      let max = 120;
      let bound = min * Math.PI;

      gsap.set(icons, {
         transformOrigin: '-20% 0%',
         // height: 40,
      });

      gsap.set(dock, {
         position: 'relative',
      });

      const updateIcons = (pointer) => {
         icons.forEach((icon, i) => {
            // let distance = i * min + min / 2 - pointer;
            // let x = 0;
            // let scale = 1;
            // if (-bound < distance && distance < bound) {
            //    let rad = (distance / min) * 0.5;
            //    scale = 1 + (max / min - 1) * Math.cos(rad);
            //    x = 2 * (max - min) * Math.sin(rad);
            // } else {
            //    x = (-bound < distance ? 2 : -2) * (max - min);
            // }
            // gsap.to(icon, {
            //    duration: 0.3,
            //    x: x,
            //    scale: scale,
            // });
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
                  ease: 'power3.out',
               });
            });
         });
      };

      const handleMouseMove = (event) => {
         let offset =
            dock.getBoundingClientRect().top + icons[0].getBoundingClientRect().height / 2;
         updateIcons(event.clientY - offset);
      };

      const handleMouseLeave = () => {
         gsap.to(icons, {
            duration: 0.3,
            scale: 1,
            x: 0,
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
               {Array.from({ length: 8 }).map((_, index) => (
                  <li
                     key={index}
                     className={s.sidebar__item}
                     ref={(el) => (iconRefs.current[index] = el)}>
                     <div className={s.sidebar__icon}>
                        <svg
                           width="20"
                           height="20"
                           viewBox="0 0 20 20"
                           fill="none"
                           xmlns="http://www.w3.org/2000/svg">
                           <path
                              d="M1.24512 1.19453H9.55879V9.50742H1.24512V1.19453Z"
                              fill="#565356"
                           />
                           <path
                              d="M10.4258 1.19453H18.7387V9.50742H10.4258V1.19453Z"
                              fill="#565356"
                           />
                           <path
                              d="M1.24512 10.3754H9.55879V18.6879H1.24512V10.3754Z"
                              fill="#565356"
                           />
                           <path
                              d="M10.4258 10.3754H18.7387V18.6879H10.4258V10.3754Z"
                              fill="#565356"
                           />
                        </svg>
                     </div>
                  </li>
               ))}
            </ul>
         </div>
      </div>
   );
};

export default Sidebar;
