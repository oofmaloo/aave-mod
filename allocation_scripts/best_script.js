// import { ethers } from "ethers";

// import time
// from itertools import product, combinations
// import { izip, cycle } from 'itertools';

let current_allocation = [
	{
		"protocol_id": 0,
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .08,
		"amount": 1000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	},
	{
		"protocol_id": 1,
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .01,
		"amount": 9000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	},
]

let tokens = [
	{
		"protocol_id": 0,
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .08,
		"liquidity": 1000000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	},
	{
		"protocol_id": 1,
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .12,
		"liquidity": 1000000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	},
	{
		"protocol_id": 2,
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .912,
		"liquidity": 1000000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	},
	{
		"protocol_id": 3,
		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
		"interest_rate": .112,
		"liquidity": 1000000000,
		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
	}
]

let allocations = []

let current_lowest_rate = 100
// total amount in aggregator
let current_total_amount = 0 
// total amount being returned annually (current_total_amount*weighted_interest_rate)
let current_return = 0 
// weighted interest rate
let current_rate = 0 
// how many steps to compile per token
// eg steps is percentage of 100
// 1 step is 1% of current_total_amount per allocation
let steps = 1

function current_rate_and_return(_current_allocation){
	// current_total_amount
	// current_return
	// current_rate
	// current_lowest_rate

	// for allocation in _current_allocation:
	// 	current_total_amount += allocation['amount']
	// 	current_return += allocation['interest_rate'] * allocation['amount']
	// 	if (allocation['interest_rate'] < current_lowest_rate):
	// 		current_lowest_rate = allocation['interest_rate']

	// current_rate = current_return / current_total_amount


	_current_allocation.map((allocation) => {
		current_total_amount += allocation['amount'];
		current_return += allocation['interest_rate'] * allocation['amount'];
		if (allocation['interest_rate'] < current_lowest_rate) {
			current_lowest_rate = allocation['interest_rate'];
		}
	});

	current_rate = current_return / current_total_amount

	return (current_rate, current_return)
}

// v1

// token_allocation_steps = {}

// token_allocation_steps = {
//     1: [
//         {
//             "rate": 1
//         }
//     ],
// 	2: [
//         {
//             "rate": 1
//         }
//     ],
  
// }


// v2
let token_allocation_steps = []

function compile_tokens_steps(){
	// current_rate, current_return = current_rate_and_return(current_allocation)

	// for token in tokens:
	// 	liquidity = 10000000000000
	// 	// liquidity = get_liquidity(token.token_address)

	// 	for step in range(steps, 101, steps):
	// 		allocation_percentage = step / 100
	// 		amount = current_total_amount * allocation_percentage
	// 		interest_rate = token['interest_rate']
	// 		# interest_rate = get_interest_rate(token.token_address, amount)
	// 		annual_return = amount * interest_rate

	// 		if amount <= liquidity:
	// 			token_allocation_steps.append({
	// 								"protocol_id": token['protocol_id'],
	// 								# "protocol_name": token['protocol_name'],
	// 								"underlying_address": token['underlying_address'],
	// 								"token_address": token['token_address'],
	// 								"interest_rate": interest_rate,
	// 								"annual_return": annual_return,
	// 								"allocation_percentage": allocation_percentage
	// 							})



	tokens.map((token) => {
		let liquidity = 10000000000000
		for (let i = 0; i < steps; i++) {
			let allocation_percentage = step / 100
			let amount = current_total_amount * allocation_percentage
			let interest_rate = token['interest_rate']
			let annual_return = amount * interest_rate
			if (amount <= liquidity) {
				token_allocation_steps.append({
					"protocol_id": token['protocol_id'],
					"protocol_name": token['protocol_name'],
					"underlying_address": token['underlying_address'],
					"token_address": token['token_address'],
					"interest_rate": interest_rate,
					"annual_return": annual_return,
					"allocation_percentage": allocation_percentage
				})
			}
		}
	});


}



let token_allocation_combinations_results = []

function check_duplicate(el){
    // visited = set()
    // has_duplicate = false
    // for element in l:
    //     if element in visited:
    //         pass
    //     elif el.count(element) == 1:
    //         visited.add(element)
    //     elif el.count(element) > 1:
    //         has_duplicate = true
    //         // console.log("The list contains duplicate elements.")
    //         break
    // if not has_duplicate:
    // 	return has_duplicate
    //     // console.log("List has no duplicate elements.")


    visited = new Set()
    let has_duplicate = false

    el.map((element) => {
	    if (visited.has(element)){
            continue
	    } else if (el.count(element) == 1){
            visited.add(element)
	    } else if (el.count(element) > 1){
			has_duplicate = true
			// console.log("The list contains duplicate elements.")
			break
        }

    })

    return has_duplicate
}

let count = 0

function get_all_combinations(){
	// global count
	for x in range(0, len(tokens)):
		console.log("x is: ", x)
		for combo_list in combinations(token_allocation_steps, r=x):
			# combo_list = list(combo)

			if len(combo_list) == 1:
				for allo in combo_list:
					if allo['allocation_percentage'] != 1.0:
						continue

			protocol_id_list = []

			for allo in combo_list:
				protocol_id_list.append(allo['protocol_id'])


			if len(protocol_id_list) > 1:
				if check_duplicate(protocol_id_list):
					continue

			
			allocation_percentage = 0

			for allo in combo_list:
				allocation_percentage += allo['allocation_percentage']


			if allocation_percentage != 1.0:
				continue

			count += 1

			token_allocation_combinations_results.append(combo_list)



	const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

}

function cartesianProduct(a) {
	(...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
}

function run(){
	start = time.time()
	# get current allocation data
	current_rate_and_return(current_allocation)

	# compile platforms and steps
	compile_tokens_steps()

	# run each combination
	# 	if allocation beats
	get_all_combinations()

	console.log(get_all_combinations())

	# token_allocation_sorted = sorted(token_allocation_combinations_results, key=lambda x: (sum(i['annual_return'] for i in x), len), reverse=false)
	token_allocation_sorted = sorted(token_allocation_combinations_results, key=lambda x: (sum(i['annual_return'] for i in x)), reverse=false)
	console.log("token_allocation_sorted", token_allocation_sorted)

	executionTime = (time.time() - start)
	console.log('Algorithm took: ' + str(executionTime), "and found ", count, " different allocations")

	console.log("Results \n ")
}

run()