function InitPage()
{
    SetPathCSV();
}

function ClearSelection() {
    if (window.confirm("Do you want clear selection of CSV file?")) {
        document.getElementById("form_clear").submit();
    }
}