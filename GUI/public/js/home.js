window.onload = function () {
    InitPage();
}

function InitPage()
{
    document.getElementById("file_csv").onchange = function () {
        document.getElementById("path_csv").value = this.value;
    }
}
