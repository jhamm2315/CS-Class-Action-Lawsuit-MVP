import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ShareViewer(){
  const { secret } = useParams();
  const [msg, setMsg] = useState("Fetching…");

  useEffect(()=>{
    (async ()=>{
      // You can implement a /shares/redeem endpoint that returns a signed URL
      setMsg("Redeem endpoint not implemented yet. (Optional feature)");
    })();
  },[secret]);

  return <div className="max-w-2xl mx-auto p-6"><h1 className="text-xl font-bold">Secure Share</h1><p>{msg}</p></div>;
}