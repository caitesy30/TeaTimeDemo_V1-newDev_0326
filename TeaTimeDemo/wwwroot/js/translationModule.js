class Translate{
    static translateModal() {
        const input = document.getElementById("modalInputText").value;

        fetch("http://localhost:8000/translate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: input })
        })
            .then(response => response.json())
            .then(data => {
                document.getElementById("modalResult").innerText = data.translation;
            })
            .catch(error => {
                document.getElementById("modalResult").innerText = "錯誤：" + error;
            });
    } 
}