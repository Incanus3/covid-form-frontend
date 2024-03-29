import * as _                            from 'lodash'
import { add, parseISO                 } from 'date-fns';
import { useState, useEffect           } from 'react';
import { Alert, Form, Button, Row, Col } from 'react-bootstrap';

import config                          from 'src/config'
import { request                     } from 'src/backend';
import { formatDate, keysToSnakeCase, keysToCamelCase } from 'src/utils/generic';
import { AsyncResult                 } from 'src/utils/results';

import {
  ExamTypeSelection, ExamDateSelection, ExamTimeSelection, InsuranceCompanySelection,
  RequestorTypeSelection, RequestFormCheckbox, FirstNameInput, LastNameInput, MunicipalityInput,
  ZipCodeInput, EmailInput, PhoneInput, InsuranceNumberInput
} from './input_components';

import { APP_TYPE_COVID_TEST, APP_TYPE_VACCINATION } from 'src/constants';
import {
  REQUESTOR_TYPE_AG, REQUESTOR_TYPE_PL, REQUESTOR_TYPE_SAMOPL,
  EXAM_TYPES, EXAM_TYPE_AG, EXAM_TYPE_PCR, EXAM_TYPE_PCR_SCRN, EXAM_TYPE_RAPID,
  INSURANCE_COMPANY_KHS
} from './constants';

const ZIP_REGEX    = /^\d{3} ?\d{2}$/;
const EMAIL_REGEX  = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-.]+\.[a-zA-Z0-9-]{2,}$/;
const PHONE_PREFIX = '(\\+|00)\\d{2,3}'
const PHONE_REGEX  = RegExp(`^(${PHONE_PREFIX}|\\(${PHONE_PREFIX}\\))? ?[1-9]\\d{2} ?\\d{3} ?\\d{3}$`);

function isValidInsuranceNumber(input) {
  const length = input.length;

  return input.match(/^\d{9,10}$/) && (length === 9 || input % 11 === 0);
}

export default function CovidForm() {
  const [haveRequestForm,     setHaveRequestForm]     = useState(false);
  const [examDate,            setExamDate]            = useState(null);
  const [requestorTypeId,     setRequestorTypeId]     = useState(null);
  const [examTypeId,          setExamTypeId]          = useState(null);
  const [timeSlotId,          setTimeSlotId]          = useState(null);
  const [firstName,           setFirstName]           = useState('');
  const [lastName,            setLastName]            = useState('');
  const [municipality,        setMunicipality]        = useState('');
  const [zipCode,             setZipCode]             = useState('');
  const [email,               setEmail]               = useState('');
  const [phoneNumber,         setPhoneNumber]         = useState('');
  const [insuranceNumber,     setInsuranceNumber]     = useState('');
  const [insuranceCompany,    setInsuranceCompany]    = useState(111);
  const [responseData,        setResponseData]        = useState(null);
  const [examTypes,           setExamTypes]           = useState([]);
  const [timeSlots,           setTimeSlots]           = useState([]);
  const [fullDates,           setFullDates]           = useState([]);
  const [startDate,           setStartDate]           = useState(new Date());
  const [endDate,             setEndDate]             = useState(add(new Date(), { months: 2 }));
  const [disabledExamTypeIds, setDisabledExamTypeIds] = useState([]);
  const [loadingExamTypes,    setLoadingExamTypes]    = useState(true);
  const [loadingTimeSlots,    setLoadingTimeSlots]    = useState(true);

  function setExamType(newExamTypeId) {
    if (newExamTypeId !== examTypeId) loadTimeSlots(newExamTypeId);

    setExamTypeId(newExamTypeId);
  }

  function setRequestorType(requestorTypeId) {
    setRequestorTypeId(requestorTypeId);

    if (config.app_type === APP_TYPE_COVID_TEST) {
      if (requestorTypeId === REQUESTOR_TYPE_AG) {
        setExamType(EXAM_TYPE_AG);
        setDisabledExamTypeIds(_.difference(EXAM_TYPES, [EXAM_TYPE_AG, EXAM_TYPE_PCR_SCRN]));
      } else if (requestorTypeId === REQUESTOR_TYPE_SAMOPL) {
        setExamType(EXAM_TYPE_RAPID);
        setDisabledExamTypeIds(_.difference(EXAM_TYPES, [EXAM_TYPE_RAPID, EXAM_TYPE_AG]));
      } else {
        const disabledTypes = [EXAM_TYPE_AG, EXAM_TYPE_PCR_SCRN, EXAM_TYPE_RAPID];

        setExamType(_.difference(EXAM_TYPES, disabledTypes)[0]);
        setDisabledExamTypeIds(disabledTypes);
      }
    }
  }

  async function loadExamTypes() {
    setLoadingExamTypes(true);

    const result = await AsyncResult.fromResponse(await request('GET', '/crud/exam_types'));

    let examTypeId;

    if (result.data.exam_types.length === 0) {
      examTypeId = null;
    } else {
      const examTypeIds = _.map(result.data.exam_types, 'id')

      if (examTypeIds.includes(EXAM_TYPE_PCR)) {
        examTypeId = EXAM_TYPE_PCR;
      } else {
        examTypeId = examTypeIds[0];
      }
    }

    // TODO: handle failure
    setExamTypes(result.data.exam_types);
    setExamType(examTypeId);
    setLoadingExamTypes(false);

    return examTypeId;
  }

  async function loadTimeSlots(examTypeId) {
    setLoadingTimeSlots(true);

    const result = await AsyncResult.fromResponse(await request('GET', '/registration/available_time_slots', {
      params: { exam_type: examTypeId }
    }));

    const firstId = result.data.time_slots[0]?.id || null

    // TODO: handle failure
    setTimeSlots(result.data.time_slots);
    setTimeSlotId(firstId);
    setLoadingTimeSlots(false);

    return firstId;
  }

  async function loadFullDates({ startDate, endDate }) {
    const result = await AsyncResult.fromResponse(await request('GET', '/registration/full_dates', {
      params: { start_date: formatDate(startDate), end_date: formatDate(endDate) }
    }));

    // TODO: handle failure
    setFullDates(result.data.dates.map((date) => parseISO(date)));
  }

  async function loadAllowedDates() {
    const result    = await AsyncResult.fromResponse(await request('GET', '/registration/allowed_dates'));
    // TODO: handle failure
    const data      = keysToCamelCase(result.data)
    const startDate = parseISO(data.startDate)
    const endDate   = parseISO(data.endDate)

    setStartDate(startDate)
    setEndDate(endDate)

    return { startDate, endDate }
  }

  useEffect(() => {
    async function loadData() {
      loadTimeSlots(await loadExamTypes());
      loadFullDates(await loadAllowedDates());
    }

    setRequestorType(REQUESTOR_TYPE_PL);
    loadData();
  // eslint-disable-next-line
  }, [])

  const submit = async () => {
    const data = {
      client: keysToSnakeCase({
        firstName, lastName, municipality, zipCode,
        email, phoneNumber, insuranceNumber, insuranceCompany,
      }),
      exam: keysToSnakeCase({
        requestorType: requestorTypeId, examType: examTypeId,
        examDate: formatDate(examDate), timeSlotId
      })
    };

    const result = await AsyncResult.fromResponse(
      await request('post', '/registration/create', { data })
    );

    setResponseData(result.data);
  }

  const reset = () => {
    setHaveRequestForm(false);
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setInsuranceNumber('');
    setInsuranceCompany(111);
    setResponseData(null);
  }

  const zipIsValid    = zipCode.match(ZIP_REGEX);
  const emailIsValid  = email.match(EMAIL_REGEX);
  const phoneIsValid  = phoneNumber.match(PHONE_REGEX);
  const insNumIsValid = insuranceCompany === INSURANCE_COMPANY_KHS
    || isValidInsuranceNumber(insuranceNumber);
  const requestFormNeeded =
    (config.app_type === APP_TYPE_COVID_TEST &&
     requestorTypeId !== REQUESTOR_TYPE_SAMOPL &&
     examTypeId      !== EXAM_TYPE_AG &&
     examTypeId      !== EXAM_TYPE_PCR_SCRN) // ||
    // (config.app_type === APP_TYPE_VACCINATION)
  const canSubmit = examDate && firstName && lastName && municipality
    && zipIsValid && emailIsValid && phoneIsValid && insNumIsValid
    && (!requestFormNeeded || haveRequestForm);

  const hasRegistered = responseData?.status === 'OK';
  const disableSubmit = !canSubmit || hasRegistered;

  var commonErrors = null;
  var insuranceNumberErrors = null;
  var responseAlert = null;

  switch(responseData?.status) {
    case 'OK':
      responseAlert = <Alert id='covid-form-alert' variant='success'>Vaše registrace byla úspěšná</Alert>;
      break;
    case 'ERROR':
      if (responseData.error) {
        commonErrors = _.join(responseData.error.map((error) => _.capitalize(error) + '.'), ' ');
      } else {
        commonErrors = 'Došlo k chybě';
      }

      if (responseData.client && responseData.client.insurance_number) {
        insuranceNumberErrors = _.join(_.uniq(responseData.client.insurance_number), ', ');
      }

      responseAlert = <Alert id='covid-form-alert' variant='danger'>{commonErrors}</Alert>;
      break;
    default:
      responseAlert = null;
  }

  return (
    <Form noValidate id="covid-form">
      <RequestorTypeSelection value={requestorTypeId} setValue={setRequestorType} />

      <ExamTypeSelection
        options={examTypes} value={examTypeId} loading={loadingExamTypes}
        setValue={setExamType} disabledValues={disabledExamTypeIds}
      />

      {requestFormNeeded &&
        <RequestFormCheckbox checked={haveRequestForm} setChecked={setHaveRequestForm} />}

      <ExamDateSelection
        value={examDate} setValue={setExamDate}
        minDate={startDate} maxDate={endDate} disabledDates={fullDates}
      />

      <ExamTimeSelection
       value={timeSlotId} setValue={setTimeSlotId} options={timeSlots} loading={loadingTimeSlots}
      />

      <Form.Row>
        <FirstNameInput value={firstName} setValue={setFirstName} as={Col} />
        <LastNameInput  value={lastName}  setValue={setLastName}  as={Col} />
      </Form.Row>

      <Form.Row>
        <MunicipalityInput value={municipality} setValue={setMunicipality} as={Col} />
        <ZipCodeInput      value={zipCode} setValue={setZipCode} isValid={zipIsValid} as={Col} />
      </Form.Row>

      <Form.Row>
        <EmailInput value={email}       setValue={setEmail}       isValid={emailIsValid} as={Col} />
        <PhoneInput value={phoneNumber} setValue={setPhoneNumber} isValid={phoneIsValid} as={Col} />
      </Form.Row>

      <InsuranceNumberInput
        value={insuranceNumber} setValue={setInsuranceNumber}
        isValid={insNumIsValid} errors={insuranceNumberErrors}
      />

      <InsuranceCompanySelection value={insuranceCompany} setValue={setInsuranceCompany} />

      <Row>
        <Col xs="auto">
          <Button
            id='covid-form-submit'
            variant={disableSubmit ? 'secondary' : 'primary'}
            size="lg" onClick={submit} disabled={disableSubmit}
          >
            Registrovat se
          </Button>
        </Col>

        <Col>
          {responseAlert}
        </Col>
      </Row>

      {hasRegistered &&
        <Button id='covid-form-reset-button' variant='primary' size="lg" onClick={reset}>Nové zadání</Button>}
    </Form>
  )
}
