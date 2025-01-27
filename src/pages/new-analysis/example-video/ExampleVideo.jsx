import React from 'react';
import s from './styles.module.scss';

const ExampleVideo = () => {
   return (
      <div className={s.exampleVideo}>
         <div className={s.exampleVideo__video}></div>
         <div className={s.exampleVideo__text}></div>
      </div>
   );
};

export default ExampleVideo;
