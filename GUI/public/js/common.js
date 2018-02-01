window.onload = function () {
    InitPage();
}

function SetPathCSV() {
    document.getElementById("file_csv").onchange = function () {
        document.getElementById("path_csv").value = this.value;
    }
    document.getElementById("path_csv").value = session.file_name;
}

const processCountKey = 'processCount';
function getProcessCount() {
    let item = localStorage.getItem(processCountKey);
    let count;
    if (item) {
        count = JSON.parse(item);
    } else {
        count = -1;
    }
    return count;
}

function setProcessCount(count) {
    localStorage.setItem(processCountKey, JSON.stringify(count));
}

const processDisplaySettingKey = 'processDisplaySetting';
function getProcessSettingList() {
    let item = localStorage.getItem(processDisplaySettingKey);
    let settingList;
    if (item) {
        settingList = JSON.parse(item);
    } else {
        settingList = [];
    }
    return settingList;
}

function setProcessSettingList(list) {
    localStorage.setItem(processDisplaySettingKey, JSON.stringify(list));
}

function setDefaultProcessSettingList() {
    const count = getProcessCount()
    let settingList = getProcessSettingList();
    for (let rank = 0; rank < count; ++rank) {
        if (settingList.length - 1 < rank) {
            settingList.push({ selected: true, color: getProcessColor(rank) })
        }
    }

    for (let rank = count; rank < settingList.length; ++rank) {
        settingList[rank].selected = false;
    }
    setProcessSettingList(settingList);
}

function getSelectedProcessList() {
    var selectedProcessList = [];
    let settingList = getProcessSettingList();
    const processCount = getProcessCount();
    for (let i = 0; i < settingList.length && i < processCount; ++i) {
        if (settingList[i].selected) {
            selectedProcessList.push(i);
        }
    }
    return selectedProcessList;
}

function setSelectedProcessList(list) {
    var settingList = getProcessSettingList();
    for (let i = 0; i < settingList.length; i++) {
        settingList[i].selected = list.includes(i);
    }
    setProcessSettingList(settingList);
}
