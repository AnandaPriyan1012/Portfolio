import { communityStory } from "../content";
import "./community-narrative.css";

/** A new portfolio composition of the existing, verified voluntary-work account. */
export default function CommunityNarrative() {
  return (
    <div className="community-purpose community-narrative">
      <span className="community-story-thread" aria-hidden="true"><span /></span>
      <div className="service-step" data-service-step="service">
        <span className="community-story-node" aria-hidden="true">01</span>
        <p className="section-label">Hands-on service</p>
        <h3>I helped prepare<br />and distribute meals.</h3>
      </div>
      <div className="service-step" data-service-step="request">
        <span className="community-story-node" aria-hidden="true">02</span>
        <p className="section-label">The next question</p>
        <h3>How else<br />could I help?</h3>
        <p>The organisers described limited online reach.</p>
      </div>
      <div className="service-step" data-service-step="contribution">
        <span className="community-story-node" aria-hidden="true">03</span>
        <p className="section-label">The digital work</p>
        <h3>A voluntary role,<br />since 2023.</h3>
        <h4 className="community-role">{communityStory.role}</h4>
        <ul>{communityStory.contributions.map((contribution) => <li key={contribution}>{contribution}</li>)}</ul>
      </div>
    </div>
  );
}
