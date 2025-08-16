const express = require('express');
const app = express();
const PORT = 8080;


app.use( express.json() )

//#1 Endpoint: GET
app.get('/tournaments', 
    (req, res) => {
    res.status(200).send({
        tournament: '500',
        size: 'XL'
    })
});

//#2 Endpoint: POST
app.post('/tournaments/:tournamentid',
    (req, res) => {
    
        const { tournamentid } = req.params; //parameters informed on the URL.
        const { description } = req.body; //parameters informed on the body of the message.
    
        if (!description){
            res.status(418).send({ message: 'We need a description!' })
        }

        res.send({
            tournaments: `Congratulations! With your ${description} and ID ${tournamentid} `,
        });
});

app.listen(
    PORT,
    () => console.log(`it's alive on http://localhost:${PORT}`)
)