import { Container, Row, Col  } from 'react-bootstrap';

import config                   from 'src/config';
import { APP_TYPE_VACCINATION } from 'src/constants';
import Export                   from './Export';
import CovidCard                from './CovidCard';
import CovidForm                from './CovidForm';

export default function CovidNavbar() {
  return (
    <Container>
      <Export />

      {config.app_type === APP_TYPE_VACCINATION ||
        <Row>
          <Col>
            <CovidCard />
          </Col>
        </Row>}

      <Row>
        <Col>
          <CovidForm />
        </Col>
      </Row>
    </Container>
  )
}
