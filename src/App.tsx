import * as React from 'react'
import * as Model from './Model'
import AmsterdamModel from './Engine'
import * as Process from './Process'

import SiteComponent from './view/Site'

class AppComponent extends React.Component {
  constructor(p: {}) {
    super(p)
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (error instanceof Model.AmsterdamError) {
      console.error(error, error.parameters)
    } else {
      console.error(error)
    }
  }

  render() {
    return <SiteComponent />
  }
}

export default AppComponent