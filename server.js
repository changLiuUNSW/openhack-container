
const express = require('express');
const yaml = require('js-yaml');
const fs = require('fs');
//const k8s = require('@kubernetes/client-node');
const Client = require('kubernetes-client').Client;
const config = require('kubernetes-client').config;


const bodyParser = require('body-parser');
const app = express();
const port =process.env.PORT||3000;

const service_name = "azure-minecraft";

const kubeconfig = yaml.safeLoad(fs.readFileSync("./kubeConfig"));

const k8client = new Client({ config: config.fromKubeconfig(kubeconfig) , version: '1.8'});

app.use(bodyParser.json());
app.use('/static',express.static('public'));

app.listen(port);


app.get('/servers',(req,res)=>{

    (async function getServers(){

        const services =  await k8client.api.v1.namespaces("default").services.get();
        
        const filteredSvs = services.body.items.filter(x =>  x.status.loadBalancer.ingress);//filter the public facing server

        const servers = filteredSvs.map(x => {
                let name = x.metadata.name;
                let eip = x.status.loadBalancer.ingress[0].ip;
                let endpoints = {};
                x.spec.ports.forEach(x => {
                    endpoints[x.name] = eip + ":" + x.targetPort;
                });

                return {
                    name: name,
                    endpoints: endpoints
                }
        })        

        res.status(200).send(servers);
    })();
})

app.get('/services',(req,res)=>{

    (async function getServices(){

        const services =  await k8client.api.v1.namespaces("default").services.get();
        res.status(200).send(services);
    })();
})


