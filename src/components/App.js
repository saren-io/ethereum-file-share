import React, {Component} from 'react';
import Web3 from 'web3';
import './App.css';
import File from '../abis/File.json'

// IPFS http code
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient({host: 'ipfs.infura.io', port: 5001, protocol: 'https'}); // leaving out the arguments will default to these values


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: '',
            buffer: null,
            contract: null,
            fileHash: "QmPpNuwSi9ctTHTafxkFQ5tGASfRqmmxhgdiYbbUqNeeWD"
        }
    }

    async componentWillMount() {
        await this.loadWeb3();
        await this.loadBlockChainData();
    }

    async loadBlockChainData() {
        const web3 = window.web3;
        const accounts = await web3.eth.getAccounts();
        this.setState({account: accounts[0]});
        const networkId = await web3.eth.net.getId();
        const networkData = File.networks[networkId];
        if (networkData) {
            const abi = File.abi;
            const address = networkData.address;
            // Fetch smart contract
            const contract = web3.eth.Contract(abi, address);
            this.setState({contract});
            const fileHash = await contract.methods.get().call();
            this.setState({fileHash});
        } else {
            window.alert('Smart contract not deployed to detected network');
        }
    }

    async loadWeb3() {
        if (window.ethereum) {
            window.web3 = new Web3(window.ethereum);
            await window.ethereum.enable();
        }
        if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            window.alert('Please install MetaMask!')
        }
    }

    captureFile = (e) => {
        e.preventDefault();
        console.log("file captured...");

        //Process file for ipfs
        let file = e.target.files[0];
        const reader = new window.FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = () => {
            this.setState({buffer: Buffer(reader.result)});
        };
    };

    // Example hash: "QmPpNuwSi9ctTHTafxkFQ5tGASfRqmmxhgdiYbbUqNeeWD"
    // Example url: https://ipfs.infura.io/ipfs/QmPpNuwSi9ctTHTafxkFQ5tGASfRqmmxhgdiYbbUqNeeWD
    onSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting form...");

        //Add file to ipfs
        ipfs.add(this.state.buffer, (err, result) => {
            const fileHash = result[0].hash;
            this.setState({fileHash});

            if (err) {
                console.log(err);
                return
            }

            // Store file on Blockchain
            this.state.contract.methods.set(fileHash).send({from: this.state.account}).then((r) => {
                this.setState({fileHash});
            });
        });
    };

    render() {
        return (
            <div>
                <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
                    <a
                        className="navbar-brand col-sm-3 col-md-2 mr-0"
                        href="http://www.dappuniversity.com/bootcamp"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Jay hates solidity
                    </a>
                    <ul className="navbar-nav px-3">
                        <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
                            <small className="text-white"><strong>Account:</strong> {this.state.account}</small>
                        </li>
                    </ul>
                </nav>
                <div className="container-fluid mt-5">
                    <div className="row">
                        <main role="main" className="col-lg-12 d-flex text-center">
                            <div className="content mr-auto ml-auto">
                                <a
                                    href="http://www.dappuniversity.com/bootcamp"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <br/>
                                    <img
                                        src={'https://ipfs.infura.io/ipfs/' + this.state.fileHash} width="300px"/>
                                </a>
                                <br/>
                                <br/>
                                <h2>Change image</h2>
                                <form onSubmit={this.onSubmit}>
                                    <input type="file" onChange={this.captureFile}/>
                                    <input type="submit"/>
                                </form>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
