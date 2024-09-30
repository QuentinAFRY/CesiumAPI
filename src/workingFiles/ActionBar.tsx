import * as React from "react"

const ActionBarCss: React.CSSProperties = {
  position: "absolute",
  bottom: "5vh",
  left: "50%",
  transform: "translateX(-50%)",  
}

interface Props {
  onButtonClick: () => void
}

function ActionBar(props: Props) {
  return(
    <button style={ActionBarCss} onClick={props.onButtonClick}>
      Import
    </button>
  )
}

export default ActionBar