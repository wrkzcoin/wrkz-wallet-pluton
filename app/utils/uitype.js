export default function uiType(darkMode) {
  const backgroundColor =
    darkMode === true ? 'has-background-dark' : 'has-background-white';

  const fillColor =
    darkMode === true ? 'has-background-black' : 'has-background-light';

  const textColor = darkMode === true ? 'has-text-white' : '';

  const redTitleColor = darkMode === true ? 'has-text-danger' : '';

  const response = { backgroundColor, fillColor, textColor, redTitleColor };

  return response;
}
