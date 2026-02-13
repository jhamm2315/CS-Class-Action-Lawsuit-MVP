import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = {error:null}; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(err, info){ console.error("UI error:", err, info); }
  render(){
    if (this.state.error) {
      return (
        <div style={{padding:"1rem"}}>
          <h2>⚠️ UI Error</h2>
          <pre style={{whiteSpace:"pre-wrap"}}>{String(this.state.error)}</pre>
          <p>Open DevTools → Console for stack trace.</p>
        </div>
      );
    }
    return this.props.children;
  }
}