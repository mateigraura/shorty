import React from "react";
import "./Container.css"

const Container = (props) => {
    // eslint-disable-next-line
    const { children, ...rest } = props;
    return (
        <div id="main">
            {children}
        </div>
    )
}

export default Container;