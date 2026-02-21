import { useState } from 'react'

const BASE_URL =
  'https://botfilter-h5ddh6dye8exb7ha.centralus-01.azurewebsites.net'

function readErrorMessage(payload) {
  if (!payload) return 'Unknown error'
  if (typeof payload === 'string') return payload
  if (typeof payload.message === 'string') return payload.message
  if (typeof payload.error === 'string') return payload.error
  return JSON.stringify(payload)
}

async function parseResponse(response) {
  const text = await response.text()
  let payload = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    throw new Error(readErrorMessage(payload))
  }

  return payload
}

function App() {
  const [email, setEmail] = useState('')
  const [candidate, setCandidate] = useState(null)
  const [jobs, setJobs] = useState([])
  const [repoByJobId, setRepoByJobId] = useState({})
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [applyStateByJobId, setApplyStateByJobId] = useState({})

  const handleLoadData = async () => {
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setGlobalError('Please enter your email first.')
      return
    }

    setIsLoadingData(true)
    setGlobalError('')
    setCandidate(null)
    setJobs([])
    setApplyStateByJobId({})

    try {
      const candidateResponse = await fetch(
        `${BASE_URL}/api/candidate/get-by-email?email=${encodeURIComponent(trimmedEmail)}`,
      )
      const candidateData = await parseResponse(candidateResponse)

      const jobsResponse = await fetch(`${BASE_URL}/api/jobs/get-list`)
      const jobsData = await parseResponse(jobsResponse)

      setCandidate(candidateData)
      setJobs(Array.isArray(jobsData) ? jobsData : [])
    } catch (error) {
      setGlobalError(error.message || 'Could not load data from API.')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleApply = async (jobId) => {
    const repoUrl = (repoByJobId[jobId] || '').trim()

    if (!candidate) {
      setGlobalError('Load your candidate data first.')
      return
    }

    if (!repoUrl) {
      setApplyStateByJobId((previous) => ({
        ...previous,
        [jobId]: { loading: false, error: 'Please enter your GitHub repo URL.', success: false },
      }))
      return
    }

    setApplyStateByJobId((previous) => ({
      ...previous,
      [jobId]: { loading: true, error: '', success: false },
    }))

    try {
      const response = await fetch(`${BASE_URL}/api/candidate/apply-to-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uuid: candidate.uuid,
          jobId,
          candidateId: candidate.candidateId,
          applicationId: candidate.applicationId,
          repoUrl,
        }),
      })

      await parseResponse(response)

      setApplyStateByJobId((previous) => ({
        ...previous,
        [jobId]: { loading: false, error: '', success: true },
      }))
    } catch (error) {
      setApplyStateByJobId((previous) => ({
        ...previous,
        [jobId]: {
          loading: false,
          error: error.message || 'Could not submit application.',
          success: false,
        },
      }))
    }
  }

  return (
    <main className="container">
      <h1>Nimble Gravity Challenge</h1>
      <p className="intro">Load your candidate profile, review open jobs and submit your application.</p>

      <section className="panel">
        <label htmlFor="email" className="label">
          Candidate email
        </label>
        <div className="row">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="input"
            disabled={isLoadingData}
          />
          <button className="button" onClick={handleLoadData} disabled={isLoadingData}>
            {isLoadingData ? 'Loading...' : 'Load data'}
          </button>
        </div>
      </section>

      {globalError ? <p className="message error">{globalError}</p> : null}

      {candidate ? (
        <section className="panel">
          <h2>Candidate</h2>
          <p>
            <strong>Name:</strong> {candidate.firstName} {candidate.lastName}
          </p>
          <p>
            <strong>Email:</strong> {candidate.email}
          </p>
          <p>
            <strong>Candidate ID:</strong> {candidate.candidateId}
          </p>
        </section>
      ) : null}

      <section className="panel">
        <h2>Open positions</h2>

        {!isLoadingData && jobs.length === 0 ? (
          <p className="muted">No jobs loaded yet. Enter your email and click "Load data".</p>
        ) : null}

        <ul className="jobList">
          {jobs.map((job) => {
            const state = applyStateByJobId[job.id] || {
              loading: false,
              error: '',
              success: false,
            }

            return (
              <li key={job.id} className="jobItem">
                <h3>{job.title}</h3>
                <p className="jobId">Job ID: {job.id}</p>

                <div className="row">
                  <input
                    type="url"
                    className="input"
                    placeholder="https://github.com/your-user/your-repo"
                    value={repoByJobId[job.id] || ''}
                    onChange={(event) =>
                      setRepoByJobId((previous) => ({
                        ...previous,
                        [job.id]: event.target.value,
                      }))
                    }
                  />

                  <button
                    className="button"
                    onClick={() => handleApply(job.id)}
                    disabled={state.loading || isLoadingData}
                  >
                    {state.loading ? 'Submitting...' : 'Submit'}
                  </button>
                </div>

                {state.error ? <p className="message error">{state.error}</p> : null}
                {state.success ? <p className="message success">Application sent successfully.</p> : null}
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}

export default App