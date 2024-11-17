import { useState } from 'react'
import GoogleMapReact from 'google-map-react';
import Webcam from "react-webcam";
import './App.css'

enum ModalType {
  VideoCall,
  Confirmation,
  PrayerList,
}

function App() {
  const [modalType, setModalType] = useState(null);
  const [prayerList, setPrayerList] = useState([]);

  const renderModal = () => {
    switch (modalType) {
      case ModalType.VideoCall:
        return (
          <div className="modalContainer" onClick={() => setModalType(null)}>
            <div className="popupModal" onClick={e => {e.preventDefault(); e.stopPropagation();}}>
              <div className="webcamContainer">
                <img className="webcamImage" src="../assets/baby.webp" />
              </div>
              <div className="modalHeader">
                <div className="modalTwoRow">
                  <span className="caption">PROMPT</span>
                  <span className="prompt">What's keeping you up at night this week?</span>
                </div>

                <div className="secondarybutton">
                  Give me another prompt
                </div>
              </div>

              <div className="modalFooter">
                <div className="secondarybutton" onClick={() => setModalType(null)}>
                  Go back
                </div>
                <div className="primarybutton" onClick={() => {
                  setModalType(ModalType.Confirmation);
                  const prayerRequest = {
                    requester: "John Li",
                    summary: 'I am so sad',
                    text: false,
                    call: true,
                  };

                  setPrayerList([...prayerList, prayerRequest]);
                }}>
                  Start recording
                </div>
              </div>
            </div>
          </div>
        );
      case ModalType.Confirmation:
        return (
          <div className="modalContainer" onClick={() => setModalType(null)}>
            <div className="confirmationModal" onClick={e => {e.preventDefault(); e.stopPropagation();}}>
              <div className="confirmationContainer">
                <div className="checkmark">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <span className="hugetext">
                  Prayer request submitted
                </span>
                <span className="hugetextcaption">
                  You'll get updates about your prayer request soon!
                </span>
              </div>
            </div>
          </div>
        );

      case ModalType.PrayerList:
        return (
          <div className="modalContainer" onClick={() => setModalType(null)}>
            <div className="tableModal" onClick={e => {e.preventDefault(); e.stopPropagation();}}>
              <div className="tableModalHeader">Prayer requests this week</div>
              <thead className="tableheader">
                <tr className="tableGrid">
                  <th>REQUESTER</th>
                  <th>SUMMARY</th>
                  <th>TEXT</th>
                  <th>CALL</th>
                </tr>
              </thead>
              <tbody className="tableheader">
                {prayerList.map((request, index) => (
                  <tr key={index} className="tablerow">
                    <td className="requestName">{request.requester}</td>
                    <td>{request.summary}</td>
                    <td>{request.text ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-thumbs-up"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg> : null}</td>
                    <td>{request.call ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-thumbs-up"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg> : null}</td>
                  </tr>
                ))}
              </tbody>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="mapBg">
      {modalType !== null && renderModal()}
      <div className="mapPlacement">
        <GoogleMapReact
          defaultCenter={{ lat: 59.95, lng: 30.33 }}
          defaultZoom={11}
          bootstrapURLKeys={{
            key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
          }}
          options={() => ({
            gestureHandling: 'none',
            zoomControl: false,
            styles: [
              {
                  "featureType": "water",
                  "elementType": "geometry",
                  "stylers": [
                      {
                          "color": "#e9e9e9"
                      },
                      {
                          "lightness": 17
                      }
                  ]
              },
              {
                  "featureType": "landscape",
                  "elementType": "geometry",
                  "stylers": [
                      {
                          "color": "#f5f5f5"
                      },
                      {
                          "lightness": 20
                      }
                  ]
              },
              {
                  "featureType": "road.highway",
                  "elementType": "geometry.fill",
                  "stylers": [
                      {
                          "color": "#ffffff"
                      },
                      {
                          "lightness": 17
                      }
                  ]
              },
              {
                  "featureType": "road.highway",
                  "elementType": "geometry.stroke",
                  "stylers": [
                      {
                          "color": "#ffffff"
                      },
                      {
                          "lightness": 29
                      },
                      {
                          "weight": 0.2
                      }
                  ]
              },
              {
                  "featureType": "road.arterial",
                  "elementType": "geometry",
                  "stylers": [
                      {
                          "color": "#ffffff"
                      },
                      {
                          "lightness": 18
                      }
                  ]
              },
              {
                  "featureType": "road.local",
                  "elementType": "geometry",
                  "stylers": [
                      {
                          "color": "#ffffff"
                      },
                      {
                          "lightness": 16
                      }
                  ]
              },
              {
                  "featureType": "poi",
                  "elementType": "geometry",
                  "stylers": [
                      {
                          "color": "#f5f5f5"
                      },
                      {
                          "lightness": 21
                      }
                  ]
              },
              {
                  "featureType": "poi.park",
                  "elementType": "geometry",
                  "stylers": [
                      {
                          "color": "#dedede"
                      },
                      {
                          "lightness": 21
                      }
                  ]
              },
              {
                  "elementType": "labels.text.stroke",
                  "stylers": [
                      {
                          "visibility": "on"
                      },
                      {
                          "color": "#ffffff"
                      },
                      {
                          "lightness": 16
                      }
                  ]
              },
              {
                  "elementType": "labels.text.fill",
                  "stylers": [
                      {
                          "saturation": 36
                      },
                      {
                          "color": "#333333"
                      },
                      {
                          "lightness": 40
                      }
                  ]
              },
              {
                  "elementType": "labels.icon",
                  "stylers": [
                      {
                          "visibility": "off"
                      }
                  ]
              },
              {
                  "featureType": "transit",
                  "elementType": "geometry",
                  "stylers": [
                      {
                          "color": "#f2f2f2"
                      },
                      {
                          "lightness": 19
                      }
                  ]
              },
              {
                  "featureType": "administrative",
                  "elementType": "geometry.fill",
                  "stylers": [
                      {
                          "color": "#fefefe"
                      },
                      {
                          "lightness": 20
                      }
                  ]
              },
              {
                  "featureType": "administrative",
                  "elementType": "geometry.stroke",
                  "stylers": [
                      {
                          "color": "#fefefe"
                      },
                      {
                          "lightness": 17
                      },
                      {
                          "weight": 1.2
                      }
                  ]
              }
          ]})}
        />
      </div>
      <div className="contents">
        <div className="header">
          <span className="starttext">About</span>
          <img className="logo" src="../assets/logo.png" onClick={() => setModalType(ModalType.PrayerList)}/>
          <span className="endtext">Invite my church</span>
        </div>

        <div className="mainAction">
          <span className="bigger">
            What can your neighborhood pray for you about?
          </span>
          <div className="modal">
            <span className="modalTitle">
              Need prayer?
            </span>

            <div className="textRow">
              <div className="textColumn">
                <span className="titleBold">Record a video</span>
                <span>Max 30 seconds, tell us what we can pray for you about.</span>
              </div>
              <div className="primarybutton" onClick={() => setModalType(ModalType.VideoCall)}>
                Start now
              </div>
            </div>
            <div className="textRow">
              <div className="textColumn">
                <span className="titleBold">Video shy?</span>
                <span>You can write a request, we'll give you a few prompts to start</span>
              </div>
              <div className="secondarybutton" onClick={() => {}}>
                Start now
              </div>
            </div>
          </div>
        </div>
        
        <div className="zipCode">
          Not your neighborhood? <a href="#">Enter your zip code</a>
        </div>
      </div>
    </div>
  )
}

export default App;
