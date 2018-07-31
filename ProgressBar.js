const { bgGreen, green } = require("chalk");

module.exports = class ProgressBar {
	constructor() {
		this.total;
		this.current;
		this.bar_length;
		this.progress_text;
		this.percentage_progress;
	}

	init(total, progress_text) {
		this.total = total;
		this.current = 0;
		this.progress_text = progress_text;
		this.bar_length = process.stdout.columns - progress_text.length - 14;
		this.update(this.current);
	}

	update(current) {
		this.bar_length = process.stdout.columns - this.progress_text.length - 14;
		this.current = current;
		const current_progress = this.current / this.total;
		this.draw(current_progress);
	}

	draw(current_progress) {
		const filled_bar_length = (current_progress * this.bar_length).toFixed(
			0
		);
		const empty_bar_length = this.bar_length - filled_bar_length;

		const filled_bar = this.get_bar(filled_bar_length, " ", bgGreen);
		const empty_bar = this.get_bar(empty_bar_length, "-");
		this.percentage_progress = (current_progress * 100).toFixed(2);

		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(
			`${this.progress_text}: [${filled_bar}${empty_bar}] | ${this.percentage_progress}%`
		);
	}

	get_bar(length, char, color = a => a) {
		let str = "";
		for (let i = 0; i < length; i++) {
			str += char;
		}
		return color(str);
	}

	close() {
		if(this.percentage_progress == 100){
			process.stdout.clearLine();
			process.stdout.cursorTo(0);
			process.stdout.write(`${this.progress_text}: ${green('Done.')} \n`);
		} else {
			process.stdout.write('\n')
		}
	}
};