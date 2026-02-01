import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { toHaveNoViolations } from 'jest-axe'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

expect.extend(toHaveNoViolations)
// expect.extend(matchers) // @testing-library/jest-dom usually extends automatically if imported

