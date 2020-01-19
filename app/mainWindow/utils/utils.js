// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
export function uiType(darkMode: boolean) {
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

export function search(
  searchedValue: any,
  arrayToSearch: any[],
  objectPropertyName: string
) {
  for (let i = 0; i < arrayToSearch.length; i++) {
    if (arrayToSearch[i][objectPropertyName] === searchedValue) {
      return arrayToSearch[i];
    }
  }
}

export function formatLikeCurrency(x: number) {
  const parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function atomicToHuman(x: number, prettyPrint?: boolean) {
  if (prettyPrint || false) {
    return `${formatLikeCurrency((x / 100).toFixed(2))}`;
  }
  return x / 100;
}

export function convertTimestamp(timestamp: Date) {
  const d = new Date(timestamp * 1000); // Convert the passed timestamp to milliseconds
  const yyyy = d.getFullYear();
  const mm = `0${d.getMonth() + 1}`.slice(-2); // Months are zero based. Add leading 0.
  const dd = `0${d.getDate()}`.slice(-2); // Add leading 0.
  const hh = `0${d.getHours()}`.slice(-2);
  const min = `0${d.getMinutes()}`.slice(-2); // Add leading 0.
  // ie: 2013-02-18, 16:35
  const time = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  return time;
}

export function roundToNearestHundredth(x: number) {
  return Math.ceil(x * 100) / 100;
}
