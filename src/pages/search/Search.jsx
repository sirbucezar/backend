import React, { useEffect, useRef, useState } from 'react';
import s from './styles.module.scss';

const Search = () => {
   const [searchTerm, setSearchTerm] = useState('');
   const [isAnimated, setIsAnimated] = useState(false);
   const searchRef = useRef(null);

   useEffect(() => {
      const interval = setInterval(() => {
         setIsAnimated((prev) => !prev);
      }, 2000);

      return () => clearInterval(interval);
   }, []);

   useEffect(() => {
      if (searchRef.current) {
         if (isAnimated) {
            searchRef.current.classList.add(s.anim);
         } else {
            searchRef.current.classList.remove(s.anim);
         }
      }
   }, [isAnimated]);

   return (
      <div className={s.search}>
         <div className={s.search__container}>
            <div className={s.search__top}>
               <div className={s.search__search} ref={searchRef}>
                  <div className={s.search__icon}>
                     <svg
                        width="57"
                        height="55"
                        viewBox="0 0 57 55"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                           d="M46.2525 6.17641C45.9019 6.05955 45.9019 5.56452 46.2525 5.44767L48.3105 4.76248C48.7628 4.61167 49.1739 4.35756 49.511 4.02032C49.8481 3.68307 50.102 3.27194 50.2526 2.81953L50.9378 0.762913C51.0547 0.412353 51.5498 0.412353 51.6666 0.762913L52.3519 2.82059C52.5027 3.27292 52.7569 3.68391 53.0942 4.02097C53.4314 4.35804 53.8426 4.61191 54.2951 4.76248L56.3519 5.44767C56.4287 5.47286 56.4955 5.52165 56.5429 5.58709C56.5903 5.65252 56.6159 5.73125 56.6159 5.81204C56.6159 5.89283 56.5903 5.97156 56.5429 6.03699C56.4955 6.10242 56.4287 6.15121 56.3519 6.17641L54.294 6.86159C53.8417 7.0123 53.4308 7.26624 53.0937 7.6033C52.7566 7.94035 52.5026 8.35127 52.3519 8.80348L51.6666 10.8612C51.6414 10.9379 51.5926 11.0048 51.5272 11.0522C51.4618 11.0996 51.383 11.1251 51.3022 11.1251C51.2214 11.1251 51.1427 11.0996 51.0773 11.0522C51.0118 11.0048 50.963 10.9379 50.9378 10.8612L50.2526 8.80348C50.1018 8.35127 49.8479 7.94035 49.5108 7.6033C49.1737 7.26624 48.7627 7.0123 48.3105 6.86159L46.2525 6.17641ZM40.8353 10.2801C40.7892 10.2649 40.7492 10.2355 40.7208 10.1962C40.6925 10.1569 40.6772 10.1097 40.6772 10.0612C40.6772 10.0128 40.6925 9.96556 40.7208 9.92628C40.7492 9.88699 40.7892 9.85765 40.8353 9.84242L42.0698 9.4313C42.6201 9.24753 43.0515 8.81623 43.2353 8.26596L43.6464 7.03156C43.6617 6.98556 43.691 6.94553 43.7303 6.91715C43.7696 6.88878 43.8168 6.8735 43.8653 6.8735C43.9137 6.8735 43.961 6.88878 44.0003 6.91715C44.0396 6.94553 44.0689 6.98556 44.0841 7.03156L44.4953 8.26596C44.5857 8.53735 44.7381 8.78395 44.9404 8.98623C45.1427 9.1885 45.3894 9.34088 45.6608 9.4313L46.8953 9.84241C46.9413 9.85765 46.9814 9.88699 47.0097 9.92628C47.0381 9.96556 47.0534 10.0128 47.0534 10.0612C47.0534 10.1097 47.0381 10.1569 47.0097 10.1962C46.9814 10.2355 46.9413 10.2649 46.8953 10.2801L45.6608 10.6912C45.3894 10.7816 45.1427 10.934 44.9404 11.1363C44.7381 11.3385 44.5857 11.5851 44.4953 11.8565L44.0841 13.0909C44.0689 13.1369 44.0396 13.177 44.0003 13.2053C43.961 13.2337 43.9137 13.249 43.8653 13.249C43.8168 13.249 43.7696 13.2337 43.7303 13.2053C43.691 13.177 43.6617 13.1369 43.6464 13.0909L43.2353 11.8565C43.1448 11.5851 42.9924 11.3385 42.7901 11.1363C42.5878 10.934 42.3412 10.7816 42.0698 10.6912L40.8353 10.2801ZM39.7208 2.77067C39.6905 2.76018 39.6643 2.74053 39.6457 2.71445C39.6272 2.68836 39.6172 2.65715 39.6172 2.62513C39.6172 2.59312 39.6272 2.5619 39.6457 2.53582C39.6643 2.50973 39.6905 2.49008 39.7208 2.4796L40.5431 2.20552C40.9107 2.08336 41.1986 1.79547 41.3208 1.42792L41.5949 0.605695C41.6054 0.575447 41.625 0.549216 41.6511 0.530654C41.6772 0.512091 41.7084 0.502116 41.7404 0.502116C41.7725 0.502116 41.8037 0.512091 41.8298 0.530654C41.8558 0.549216 41.8755 0.575447 41.886 0.605695L42.1601 1.42792C42.2204 1.60905 42.322 1.77364 42.457 1.90863C42.592 2.04361 42.7566 2.14526 42.9378 2.20552L43.7601 2.4796C43.7904 2.49008 43.8166 2.50973 43.8351 2.53582C43.8537 2.5619 43.8637 2.59312 43.8637 2.62513C43.8637 2.65715 43.8537 2.68836 43.8351 2.71445C43.8166 2.74053 43.7904 2.76018 43.7601 2.77067L42.9378 3.04474C42.7566 3.105 42.592 3.20665 42.457 3.34163C42.322 3.47662 42.2204 3.64121 42.1601 3.82235L41.886 4.6435C41.8755 4.67375 41.8558 4.69998 41.8298 4.71854C41.8037 4.73711 41.7725 4.74708 41.7404 4.74708C41.7084 4.74708 41.6772 4.73711 41.6511 4.71854C41.625 4.69998 41.6054 4.67375 41.5949 4.64351L41.3208 3.82128C41.1986 3.45373 40.9107 3.16584 40.5431 3.04368L39.7208 2.77067Z"
                           fill="white"
                        />
                        <path
                           d="M49.8978 49.6916L38.5299 37.9384C41.2668 34.1714 42.7442 29.5862 42.7392 24.8749C42.7392 12.8406 33.2694 3.0498 21.6298 3.0498C9.99005 3.0498 0.520264 12.8406 0.520264 24.8749C0.520264 36.9091 9.99005 46.6999 21.6298 46.6999C26.1867 46.7051 30.6215 45.1776 34.265 42.3479L45.6329 54.1011C46.2083 54.6329 46.9588 54.9168 47.7304 54.8945C48.5019 54.8722 49.2359 54.5453 49.7816 53.9811C50.3274 53.4168 50.6436 52.6579 50.6651 51.8602C50.6867 51.0625 50.4122 50.2866 49.8978 49.6916ZM6.55155 24.8749C6.55155 21.7916 7.43587 18.7776 9.09268 16.2139C10.7495 13.6502 13.1044 11.6521 15.8596 10.4722C18.6148 9.29228 21.6465 8.98356 24.5714 9.58508C27.4962 10.1866 30.1829 11.6713 32.2916 13.8515C34.4004 16.0318 35.8364 18.8095 36.4182 21.8335C37 24.8576 36.7014 27.9921 35.5602 30.8406C34.419 33.6892 32.4864 36.1239 30.0068 37.8369C27.5272 39.5499 24.6119 40.4642 21.6298 40.4642C17.6322 40.4592 13.7998 38.8152 10.9731 35.8927C8.14647 32.9702 6.55634 29.0079 6.55155 24.8749Z"
                           fill="#eee"
                        />
                     </svg>
                  </div>
                  <input
                     type="text"
                     placeholder="Search... with AI"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>
            <div className={s.search__body}></div>
         </div>
      </div>
   );
};

export default Search;
