import { Canvas } from '@react-three/fiber';
import React, { Suspense } from 'react';
import CanvasLoader from '../../../components/canvas-loader/CanvasLoader';
import { PerspectiveCamera } from '@react-three/drei';
import HeroCamera from '../../../components/hero-camera/HeroCamera';
import Computer from './computer/Computer';
import s from './styles.module.scss';

const LoadingScreen = () => {
   return (
      <div>
         <Canvas className={s.canvas} style={{ position: 'absolute' }}>
            <Suspense fallback={<CanvasLoader />}>
               {/* <CanvasLoader /> */}
               <PerspectiveCamera
                  makeDefault
                  position={[0, 0, 30]}
                  // rotation={[-Math.PI / 2, 0, Math.PI / 4]}
                  // onUpdate={handleCameraReady}
               />
               <Computer
                  // scale={0.05}
                  // scale={[x.scale, x.scale, x.scale]}
                  position={[1, -8, -1]}
                  rotation={[0.1, -Math.PI, 0]}
                  scale={[0.1, 0.1, 0.1]}
                  // position={[0, 0, 0]}
               />
               <ambientLight intensity={1} />
               <directionalLight position={[10, 10, 10]} intensity={1} />
            </Suspense>
         </Canvas>
      </div>
   );
};

export default LoadingScreen;
