import React from 'react'; // eslint-disable-line
import classnames from 'classnames';

/**
 * @param {object} title - todo
 * @param {object} cards - todo
 * @param {object} className - todo
 * @return {jsx}
 */
const CardGroup = ({ cards, title, className }: { cards: any; title?: string; className?: string }) => {
	const renderedTitle = title ? <h1>{title}</h1> : null;

	return (
		<div className={classnames(className)}>
			{renderedTitle}
			{cards}
		</div>
	);
};

export default CardGroup;
