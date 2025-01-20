export default function PreviousSeasonAward({ type }: { type: string }) {
	switch (type) {
		case 'bronze':
			return <span title="This player was in the 3rd tier of ranks in the previous season" className="season-award bronze" />;
		case 'silver':
			return <span title="This player was in the 2nd tier of ranks in the previous season" className="season-award silver" />;
		case 'gold':
			return <span title="This player was in the top tier of ranks in the previous season" className="season-award gold" />;
		case 'gold1':
			return <span title="This player was the #1 ranked player of the previous season" className="season-award gold1" />;
		case 'gold2':
			return <span title="This player was 2nd highest player of the previous season" className="season-award gold2" />;
		case 'gold3':
			return <span title="This player was 3rd highest player of the previous season" className="season-award gold3" />;
		case 'gold4':
			return <span title="This player was 4th highest player of the previous season" className="season-award gold4" />;
		case 'gold5':
			return <span title="This player was 5th highest player of the previous season" className="season-award gold5" />;
		default:
			return <></>;
	}
}
