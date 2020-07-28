import React, { useState, useEffect } from "react";
import Container from "./components/Container"
import { FaCopy } from "react-icons/fa";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from "./assets/logo.png";
import {
  Row,
  Col,
  Form,
  Button,
  ListGroup,
  Tooltip,
  OverlayTrigger
} from "react-bootstrap"


const ListRow = ({ data, index }) => {
  const host = window.location.hostname;

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url).then(() => {
      toast.info("Url copied !", {
        position: "top-right",
        autoClose: 2000,
        closeOnClick: true,
        pauseOnHover: true,
      });
    });
  }

  return (
    <Row key={index} style={styles.listR}>
      <Col md={{ span: 7 }}>
        <a href={`${data.url}`} style={styles.link}>
          {data.url}
        </a>
      </Col>
      <Col md={{ span: 4 }}>
        <h6 style={styles.hCol}>{host}/{data.slug}</h6>
      </Col>
      <Col md={{ span: 1 }}>
        <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">Copy to clipboard</Tooltip>}>
          <FaCopy
            key={index}
            size={24}
            style={styles.icon}
            onClick={() => copyToClipboard(`${host}/${data.slug}`)}
          />
        </OverlayTrigger>
      </Col>
    </Row>
  )
}

const App = () => {
  const [url, setUrl] = useState("");
  const [createdUrls, setCreatedUrls] = useState([]);

  useEffect(() => {
    const savedUrls = JSON.parse(localStorage.getItem('urls')) || [];

    if (savedUrls.length !== 0) {
      setCreatedUrls([...createdUrls, ...savedUrls]);
    }
    // eslint-disable-next-line
  }, [])

  const shortenUrl = async (e) => {
    e.preventDefault();
    const fetchIp = await fetch("https://api.ipify.org?format=json", {
      method: "GET",
    });

    const ip = await fetchIp.json();

    const fetchResponse = await fetch("/api/shorten", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        url: url,
        ip: ip.ip
      })
    });

    if (fetchResponse.status === 500) {
      toast.warning("Oops, something went wrong!", {
        position: "top-right",
        autoClose: 4000,
        closeOnClick: true,
        pauseOnHover: true,
      });
    } else {
      const response = await fetchResponse.json();

      if (response.status === 403) {
        toast.warning(response.message, {
          position: "top-right",
          autoClose: 4000,
          closeOnClick: true,
          pauseOnHover: true,
        });
      } else if (response.status === 200) {
        const savedUrls = JSON.parse(localStorage.getItem('urls')) || [];

        if (!savedUrls.filter(el => el.url === response.url).length) {
          savedUrls.push(response);
          localStorage.setItem("urls", JSON.stringify(savedUrls));

          setCreatedUrls([...createdUrls, response]);
        } else {
          toast.warning(`You already shortened ${response.url}`, {
            position: "top-right",
            autoClose: 4000,
            closeOnClick: true,
            pauseOnHover: true,
          });
        }
      }
    }
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col style={styles.pane} md={{ span: 6, offset: 3 }} sm={{ span: 8, offset: 2 }}>
          <img style={styles.img} src={logo} height={110} width={80} alt="logo" />
          <h1 style={styles.hTitle}>URL shortener</h1>
        </Col>
      </Row>
      <Row>
        <Col md={{ span: 6, offset: 3 }} sm={{ span: 8, offset: 2 }}>
          <Form style={styles.form}>
            <Form.Row className="align-items-center">
              <Col md={{ span: 10 }}>
                <Form.Label htmlFor="inlineFormInput" srOnly>
                  Enter the url you want to shorten
                </Form.Label>
                <Form.Control
                  className="mb-2"
                  id="inlineFormInput"
                  placeholder="Enter the url you want to shorten"
                  onChange={e => setUrl(e.target.value)}
                />
              </Col>
              <Col md={{ span: 2 }}>
                <Button
                  type="submit"
                  className="mb-2"
                  variant="dark"
                  block
                  onClick={e => shortenUrl(e)}
                >
                  Shorten
                </Button>
              </Col>
            </Form.Row>
          </Form>
        </Col>
      </Row>
      {
        createdUrls.length !== 0 &&
        <Row>
          <Col md={{ span: 6, offset: 3 }}>
            <ListGroup variant="flush" style={styles.listG}>
              {
                createdUrls.map((data, i) => (
                  <ListRow data={data} index={i} />
                ))
              }
            </ListGroup>
          </Col>
        </Row>
      }
      <ToastContainer />
    </Container>
  );
}

const styles = {
  pane: {
    marginTop: "8%",
    padding: 0
  },
  form: {
    marginTop: 15,
    marginBottom: 40
  },
  icon: {
    display: 'flex',
    justifyContent: 'flex-end',
    cursor: "pointer",
    color: "#7F8F95",
    marginBottom: 2,
    marginLeft: 10
  },
  hCol: {
    color: "#7F8F95",
  },
  link: {
    color: "#4088ed",
    display: "inline-block",
    width: 250,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  listG: {
    marginLeft: 0,
  },
  listR: {
    borderBottom: "1px solid #ccc",
    marginBottom: 20
  },
  hTitle: {
    color: "#7F8F95",
    position: "relative",
    top: 18,
    left: 10
  },
  img: {
    float: "left"
  }
}

export default App;
