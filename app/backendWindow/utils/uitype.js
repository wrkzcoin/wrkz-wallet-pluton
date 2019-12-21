// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
export default function uiType(darkMode: boolean) {
  const backgroundColor = darkMode
    ? 'has-background-dark'
    : 'has-background-white';

  const fillColor = darkMode ? 'has-background-black' : 'has-background-light';

  const textColor = darkMode ? 'has-text-white' : 'has-text-dark';

  const redTitleColor = darkMode ? 'has-text-danger' : '';

  const elementBaseColor = darkMode ? 'is-black' : 'is-light';

  const tableMode = darkMode ? 'table-darkmode' : '';

  const settingsCogColor = darkMode ? 'is-dark' : '';

  const linkColor = darkMode ? 'darklink' : '';

  const buttonColor = darkMode ? 'is-dark' : '';

  const toolTipColor = darkMode ? 'dark' : 'light';

  const menuActiveColor = darkMode
    ? 'has-background-black-ter'
    : 'has-background-light';

  const response = {
    backgroundColor,
    fillColor,
    textColor,
    redTitleColor,
    elementBaseColor,
    tableMode,
    settingsCogColor,
    linkColor,
    buttonColor,
    menuActiveColor,
    toolTipColor
  };

  return response;
}
