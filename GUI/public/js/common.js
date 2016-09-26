window.onload = function () {
    InitPage();
}

function SetPathCSV()
{
    document.getElementById("file_csv").onchange = function () {
        document.getElementById("path_csv").value = this.value;
    }
    document.getElementById("path_csv").value = session.file_name;
}
