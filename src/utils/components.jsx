import 'element-closest';
import cs                                               from 'date-fns/locale/cs';
import { useState, useEffect                          } from 'react';
import { Button, Form, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';

registerLocale('cs', cs);
setDefaultLocale('cs');

export { DatePicker };

export function WithTooltip({ text, children }) {
  return (
    <OverlayTrigger overlay={<Tooltip>{text}</Tooltip>}>{children}</OverlayTrigger>
  )
}

export function Radio(props) {
  return (
    <Form.Check
      type="radio"
      label={props.label}
      id={props.id}
      checked={props.value === props.id}
      disabled={props.disabled}
      onChange={() => props.onChange(props.id)}
    />
  )
}

export function RadioGroup(props) {
  return (
    <Form.Group controlId={props.id}>
      <Form.Label>{props.label}</Form.Label>
      {props.options.map((option) =>
        <Radio
          label={option.label}
          id={option.id}
          key={option.id}
          value={props.value}
          onChange={props.setter}
          disabled={(props.disabledIds || []).includes(option.id)}
        />)}
    </Form.Group>
  )
}

export function ConfirmModal({
  title, prompt, onConfirm, onCancel, show = true,
  confirmText = 'Ano', cancelText = 'Ne',
  confirmButtonVariant = 'danger', cancelButtonVariant = 'secondary',
}) {
  return (
    <Modal show={show} onHide={onCancel} id='time-slot-modal'>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {prompt}
      </Modal.Body>

      <Modal.Footer>
        <Button variant={cancelButtonVariant } onClick={onCancel } >{cancelText }</Button>
        <Button variant={confirmButtonVariant} onClick={onConfirm} >{confirmText}</Button>
      </Modal.Footer>
    </Modal>
  );
}

const MONTH_CONTAINER_CLASS    = "react-datepicker__month-container";
const MAX_EXPECTED_COL_PADDING = 50;

export function ResponsiveDatePicker(props) {
  if (!props.id) {
    throw new Error("ResponsiveDatePicker must have a unique id");
  }

  useWindowSize();

  var [monthsShown, setMonthsShown] = useState(1);

  var containerElement = document.getElementById(props.id);

  if (containerElement) {
    var monthContainerElement = containerElement.getElementsByClassName(MONTH_CONTAINER_CLASS)[0];
    var monthsToShow;

    if (containerElement.closest) {
      var containingColumnElement = containerElement.closest(".col");

      monthsToShow = Math.max(1, Math.floor(
        (containingColumnElement.clientWidth - MAX_EXPECTED_COL_PADDING)
        / monthContainerElement.clientWidth
      ));
    } else {
      monthsToShow = 2;
    }

    if (monthsToShow !== monthsShown) {
      setMonthsShown(monthsToShow);
    }
  }

  return (
    <div id={props.id}>
      <DatePicker {...props} monthsShown={monthsShown} />
    </div>
  );
}

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width:  undefined,
    height: undefined,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
}
