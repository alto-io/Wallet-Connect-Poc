import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'
import { useWeb3Modal } from '@web3modal/ethers/react'
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react'
import { Eip1193Provider, JsonRpcSigner } from 'ethers'
import { BrowserProvider, Contract, formatUnits } from 'ethers'
import AddressRegistryAbi from "@/AddressRegistry.json";
import { useEffect } from 'react'

export default function Home() {
  const metadata = {
    name: 'My Website',
    description: 'My Website description',
    url: 'https://mywebsite.com', // origin must match your domain & subdomain
    icons: ['https://avatars.mywebsite.com/']
  }

  const ethersConfig = defaultConfig({
    /*Required*/
    metadata,
    /*Optional*/
    enableEIP6963: true, // true by default
    enableInjected: true, // true by default
    enableCoinbase: true, // true by default
    defaultChainId: 11155111, // used for the Coinbase SDK
    auth: {
      socials: ["google", "x", "github", "discord", "apple"],
      walletFeatures: true,
      email: true,
      showWallets: true
    }
  })

  createWeb3Modal({
    ethersConfig,
    chains: [{
      chainId: 11155111,
      name: "Sepolia",
      currency: "ETH",
      explorerUrl: "https://sepolia.etherscan.io",
      rpcUrl: "<ADD_RPC_URL_HERE>"
    },
    {
      chainId: 84532,
      name: "Base Sepolia",
      currency: "ETH",
      explorerUrl: "https://sepolia.basescan.org",
      rpcUrl: "<ADD_RPC_URL_HERE>"
    }],
    projectId: "<ADD_PROJECT_ID_HERE>",
    enableAnalytics: true // Optional - defaults to your Cloud configuration
  })

  const { open } = useWeb3Modal()
  const { address, chainId, isConnected, status } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider()

  const getGameRegistryAddress = async () => {
    try {
      if (!isConnected) throw Error('User disconnected')

      const ethersProvider = new BrowserProvider(walletProvider as Eip1193Provider)
      const signer = await ethersProvider.getSigner()
  
      const contract = new Contract("0xc5156e7b549a8e68d00ded62ede59db8a3fec950", AddressRegistryAbi, signer);
      console.log("GAME REGISTRY", await contract.gameRegistry());

      return contract.gameRegistry();
    } catch (error) {
      console.log(error);
    }
  }

  const getAddress = async () => {
    // This works
    await getGameRegistryAddress()

    // This doesn't work
    // With Social login wallets, if we execute this code ? This will not work
    // But this works well with metamask.

    // There seems to be some issue with running concurrent RPC calls with social login provider
    // await Promise.all([
    //   getGameRegistryAddress(),
    //   getGameRegistryAddress(),
    //   getGameRegistryAddress(),
    //   getGameRegistryAddress()
    // ])
  } 

  useEffect(() => {
    // For metamask, when refreshing the page after wallet connection, the status transition is 
    // reconnecting => connected

    // For social login wallets, when refreshing the page after wallet connection, the status transition is
    // reconnecting => disconnected => connected

    // The disconnected status is a wrong and inconsistent. Due to this, we can't able to relay on status field of wallet connect
    console.log("Wallet Status: ", status);
  });

  const signMessage = async () => {
    try {
      const provider = new BrowserProvider(walletProvider as Eip1193Provider, chainId);
      const signer = new JsonRpcSigner(provider, address);
  
      // The same concurrency issue affects the signing as well
      // While calling signMessage function, if there is any other RPC call to the social login provider happens ?
      // the signing process behaves incorrectly
      // This is not the case for metamask connection though

      // commenting this and running the app will perform a correct signing process
      // uncommenting the following line and running the signing process will leads to inconsistent behaviour
      getGameRegistryAddress()

      const signature = await signer.signMessage("random message");
  
      console.log("Signature: ", signature);
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  useEffect(() => {
    if (isConnected && walletProvider) {
      signMessage();
    }
  }, [isConnected, walletProvider])

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center", alignItems: "center", height: "250px", width: "800px", backgroundColor: "#77c4ff", borderRadius: "5px" }}>
        <button style={{ backgroundColor: "black", color: "white", padding: "10px", borderRadius: "5px" }} onClick={() => open()}>{ isConnected ? "Connected" : "Connect" }</button>
        <button style={{ backgroundColor: "black", color: "white", padding: "10px", borderRadius: "5px" }} onClick={() => open({ view: 'Networks' })}>Open Network Modal</button>
        {
          isConnected && <div style={{ display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center", alignItems: "center" }}>
              <p>Wallet Address: {address}</p>
              <p>chainId: {chainId}</p>
              <button style={{ backgroundColor: "black", color: "white", padding: "10px", borderRadius: "5px" }} onClick={getAddress}>Get Contract Address</button>
          </div>
        }
      </div>
    </div>
  );
}
