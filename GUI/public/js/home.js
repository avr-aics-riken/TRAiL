window.onload = function () {
    InitPage();
}

function InitPage()
{
    document.getElementById("file_csv").onchange = function () {
        document.getElementById("path_csv").value = this.value;
    }
}

function ClearSelection() {
    if (window.confirm("Do you want clear selection of CSV file?")) {
        document.getElementById("form_clear").submit();
    }
}