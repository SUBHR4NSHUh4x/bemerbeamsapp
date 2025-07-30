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

function convertFromFaToText(icon) {
  // Handle case where icon is already a string
  if (typeof icon === 'string') {
    return icon;
  }
  
  // Handle case where icon is an object with iconName property
  if (icon && icon.iconName) {
    switch (icon.iconName) {
      case 'code':
        return 'faCode';
      case 'flask':
        return 'faFlask';
      case 'book':
        return 'faBook';
      case 'globe':
        return 'faGlobe';
      case 'laptop-code':
        return 'faLaptopCode';
      case 'palette':
        return 'faPalette';
      case 'comments':
        return 'faComments';
      case 'phone-alt':
        return 'faPhoneAlt';
      case 'envelope':
        return 'faEnvelope';
      case 'share-alt':
        return 'faShareAlt';
      case 'search':
        return 'faSearch';
      case 'sliders-h':
        return 'faSlidersH';
      case 'filter':
        return 'faFilter';
      case 'sort':
        return 'faSort';
      case 'chart-pie':
        return 'faChartPie';
      case 'table':
        return 'faTable';
      case 'database':
        return 'faDatabase';
      case 'file-alt':
        return 'faFileAlt';
      case 'camera':
        return 'faCamera';
      case 'calculator':
        return 'faCalculator';
      case 'question':
        return 'faQuestion';
      default:
        return 'faQuestion';
    }
  }
  
  // Fallback to object comparison (less reliable)
  if (icon === faCode) {
    return 'faCode';
  } else if (icon === faFlask) {
    return 'faFlask';
  } else if (icon === faBook) {
    return 'faBook';
  } else if (icon === faGlobe) {
    return 'faGlobe';
  } else if (icon === faLaptopCode) {
    return 'faLaptopCode';
  } else if (icon === faPalette) {
    return 'faPalette';
  } else if (icon === faComments) {
    return 'faComments';
  } else if (icon === faPhoneAlt) {
    return 'faPhoneAlt';
  } else if (icon === faEnvelope) {
    return 'faEnvelope';
  } else if (icon === faShareAlt) {
    return 'faShareAlt';
  } else if (icon === faSearch) {
    return 'faSearch';
  } else if (icon === faSlidersH) {
    return 'faSlidersH';
  } else if (icon === faFilter) {
    return 'faFilter';
  } else if (icon === faSort) {
    return 'faSort';
  } else if (icon === faChartPie) {
    return 'faChartPie';
  } else if (icon === faTable) {
    return 'faTable';
  } else if (icon === faDatabase) {
    return 'faDatabase';
  } else if (icon === faFileAlt) {
    return 'faFileAlt';
  } else if (icon === faCamera) {
    return 'faCamera';
  } else if (icon === faCalculator) {
    return 'faCalculator';
  } else {
    return 'faQuestion';
  }
}

export default convertFromFaToText;
