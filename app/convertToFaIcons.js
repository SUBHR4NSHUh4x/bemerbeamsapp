import {
  faCode,
  faFlask,
  faBook,
  faGlobe,
  faLaptopCode,
  faPalette,
  faComments,
  faPhoneAlt,
  faEnvelope,
  faShareAlt,
  faSearch,
  faSlidersH,
  faFilter,
  faSort,
  faChartPie,
  faTable,
  faDatabase,
  faFileAlt,
  faCamera,
  faCalculator,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';

function convertToFaIcons(textIcon) {
  switch (textIcon) {
    case 'faCode':
      return faCode;
    case 'faFlask':
      return faFlask;
    case 'faBook':
      return faBook;
    case 'faGlobe':
      return faGlobe;
    case 'faLaptopCode':
      return faLaptopCode;
    case 'faPalette':
      return faPalette;
    case 'faComments':
      return faComments;
    case 'faPhoneAlt':
      return faPhoneAlt;
    case 'faEnvelope':
      return faEnvelope;
    case 'faShareAlt':
      return faShareAlt;
    case 'faSearch':
      return faSearch;
    case 'faSlidersH':
      return faSlidersH;
    case 'faFilter':
      return faFilter;
    case 'faSort':
      return faSort;
    case 'faChartPie':
      return faChartPie;
    case 'faTable':
      return faTable;
    case 'faDatabase':
      return faDatabase;
    case 'faFileAlt':
      return faFileAlt;
    case 'faCamera':
      return faCamera;
    case 'faCalculator':
      return faCalculator;
    default:
      return faQuestion;
  }
}

export default convertToFaIcons;
